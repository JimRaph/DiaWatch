import logging
from datetime import datetime, timezone
from typing import Optional
from uuid6 import uuid7
import numpy as np

from fastapi import (
    APIRouter,
    Depends,
    BackgroundTasks,
    HTTPException,
    Request,
    Response,
    Cookie,
    status,
)
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, or_, and_

from database import (
    get_db,
    SessionLocal,
    PredictionStore,
    MonitorStore,
    log_prediction_for_monitoring,
    User,
)
from schema import DiaRequest, FeedbackRequest, PredictionResponse
from inference import InferenceError
from recommendation import advisor, RecommendationError
from auth import get_current_user_optional, get_current_user_required

logger = logging.getLogger(__name__)

router = APIRouter(tags=["endpoints"])

TRAINING_RANGES = {
    "age": (19.0, 80.0),
    "bmi": (14.1, 92.3),
    "waist_circumference": (55.5, 233.16),
}


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    request: DiaRequest,
    background_tasks: BackgroundTasks,
    http_request: Request,
    response: Response,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
    guest_id_cookie: Optional[str] = Cookie(None, alias="guest_id"),
):
    """
    screening prediction with personalized recommendations.
    """
    inference_engine = http_request.app.state.inference_engine
    if inference_engine is None or not inference_engine.is_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Service is not available.",
        )
    user_id = None
    is_guest = True
    guest_id = None

    if current_user:
        print(f"current user: {current_user.id}")
        user_id = current_user.id
        is_guest = False
    else:
        guest_id = guest_id_cookie
        is_guest = True

        if not guest_id_cookie:
            response.set_cookie(
                key="guest_id",
                value=guest_id,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=60 * 60 * 24 * 30,
            )

    try:
        prediction_id = str(uuid7())

        clinical_data = request.clinical_features.dict()

        for feature, (min_val, max_val) in TRAINING_RANGES.items():
            if feature in clinical_data and clinical_data[feature] is not None:
                clinical_data[feature] = float(
                    np.clip(clinical_data[feature], min_val, max_val)
                )

        if clinical_data.get("gender") == "Male":
            clinical_data["is_pregnant"] = "No"

        pred_class, probabilities, explanations = inference_engine.predict(
            clinical_data
        )

        labels = ["Healthy", "Prediabetes", "Diabetes"]
        pred_label = labels[pred_class]

        try:
            report = advisor.generate_report(
                pred_label=pred_label,
                shap_explanations=explanations,
                lifestyle_data=request.lifestyle_features.dict()
                if request.lifestyle_features
                else {},
                health_note=request.health_note or "",
            )
        except RecommendationError as e:
            logger.warning(f"Recommendation generation failed: {e}")
            report = "Recommendation unavailable at the moment."

        response = PredictionResponse(
            prediction_id=prediction_id,
            prediction_label=pred_label,
            prediction_class=pred_class,
            confidence_scores={
                "healthy": float(probabilities[0]),
                "prediabetes": float(probabilities[1]),
                "diabetes": float(probabilities[2]),
            },
            personalized_report=report,
            top_risk_factors=sorted(
                explanations, key=lambda x: abs(x["impact"]), reverse=True
            )[:3],
            model_version=inference_engine.get_model_version(),
            guest_id=guest_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            verification_status="pending",
            actual_class=None,
            feedback_timestamp=None,
        )

        # user_id = current_user.id if current_user else None

        background_tasks.add_task(
            persist_prediction,
            prediction_id=prediction_id,
            request_data=request,
            prediction_result=response,
            explanations=explanations,
            user_id=user_id,
            is_guest=is_guest,
            guest_id=guest_id,
        )

        logger.info(f"Prediction {prediction_id} | User: {user_id or 'Guest'}")
        return response

    except InferenceError as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error in prediction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal processing error",
        )


@router.post("/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    """
    Submit ground truth feedback for a prediction.
    Automatically sets verification_status based on whether user confirms or corrects AI.
    """
    try:
        record = (
            db.query(PredictionStore)
            .filter(PredictionStore.id == request.prediction_id)
            .with_for_update()
            .first()
        )

        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found"
            )

        if record.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to submit feedback for this prediction",
            )

        # Check if already verified (either verified, corrected, or declined)
        if record.verification_status in ["verified", "corrected", "unverified"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Feedback already submitted for this prediction",
            )

        # Determine verification status based on comparison
        if request.actual_class == record.prediction_class:
            record.verification_status = "verified"
        else:
            record.verification_status = "corrected"

        record.actual_class = request.actual_class
        record.feedback_timestamp = func.now()

        # Update or create monitor record (existing logic)
        monitor_record = (
            db.query(MonitorStore)
            .filter(MonitorStore.prediction_id == request.prediction_id)
            .with_for_update()
            .first()
        )

        if not monitor_record:
            monitor_record = MonitorStore(
                prediction_id=request.prediction_id,
                user_id=current_user.id,
                prediction=record.prediction_class,
                actual=request.actual_class,
                features=record.clinical_inputs,
                feedback_timestamp=func.now(),
            )
            db.add(monitor_record)
        else:
            monitor_record.actual = request.actual_class
            monitor_record.feedback_timestamp = func.now()

        db.commit()

        logger.info(
            f"Feedback logged for {request.prediction_id}: "
            f"predicted={record.prediction_class}, actual={request.actual_class}, "
            f"status={record.verification_status}"
        )

        return {
            "status": "success",
            "verification_status": record.verification_status,
            "message": f"Prediction {record.verification_status} successfully",
        }

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log feedback",
        )


@router.post("/predictions/{prediction_id}/decline-verification")
async def decline_verification(
    prediction_id: str,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):

    try:
        record = (
            db.query(PredictionStore)
            .filter(PredictionStore.id == prediction_id)
            .first()
        )

        if not record:
            raise HTTPException(404, "Prediction not found")

        if record.user_id != current_user.id:
            raise HTTPException(403, "Not authorized")

        # Only allow declining if still pending
        if record.verification_status != "pending":
            raise HTTPException(
                400,
                f"Cannot decline verification with status: {record.verification_status}",
            )

        record.verification_status = "unverified"
        db.commit()

        return {"status": "success", "message": "Verification declined"}

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error declining verification: {e}")
        raise HTTPException(500, "Failed to update verification status")


def persist_prediction(
    prediction_id: str,
    request_data: DiaRequest,
    prediction_result: PredictionResponse,
    explanations: list,
    user_id: int = None,
    is_guest: bool = False,
    guest_id: str = None,
):
    """
    Persist prediction to database using a fresh,
    independent session for background work.
    """
    db = SessionLocal()

    max_retries = 3
    for attempt in range(max_retries):
        try:
            new_log = PredictionStore(
                id=prediction_id,
                user_id=user_id,
                timestamp=func.now(),
                clinical_inputs=request_data.clinical_features.dict(),
                lifestyle_inputs=request_data.lifestyle_features.dict(),
                health_note=request_data.health_note,
                prediction_class=prediction_result.prediction_class,
                prediction_label=prediction_result.prediction_label,
                confidence_scores=prediction_result.confidence_scores,
                shap_explanations=explanations,
                model_version=prediction_result.model_version,
                is_guest=is_guest,
                guest_id=guest_id,
                personalized_report=prediction_result.personalized_report.dict(),
                top_risk_factors=prediction_result.top_risk_factors,
                verification_status="pending",
                actual_class=None,
                feedback_timestamp=None,
            )

            db.add(new_log)

            db.flush()

            log_prediction_for_monitoring(db, new_log)

            db.commit()
            logger.info(
                f"Prediction {prediction_id} persisted successfully in background."
            )
            break

        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                logger.critical(f"Persistence failed for {prediction_id}")
        finally:
            if attempt == max_retries - 1 or "success" in locals():
                db.close()


@router.get("/users/screenings/history")
async def get_user_history(
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
    cursor: Optional[str] = None,
    limit: int = 20,
):
    query = db.query(PredictionStore).filter(PredictionStore.user_id == current_user.id)

    if cursor:
        try:
            timestamp_str, id_str = cursor.split(":")
            cursor_time = datetime.fromisoformat(timestamp_str)
            cursor_id = int(id_str)

            query = query.filter(
                or_(
                    PredictionStore.timestamp < cursor_time,
                    and_(
                        PredictionStore.timestamp == cursor_time,
                        PredictionStore.id < cursor_id,
                    ),
                )
            )
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Invalid cursor format")

    records = (
        query.order_by(PredictionStore.timestamp.desc(), PredictionStore.id.desc())
        .limit(limit + 1)
        .all()
    )

    has_more = len(records) > limit
    records = records[:-1] if has_more else records

    next_cursor = None
    if has_more and records:
        last = records[-1]
        next_cursor = f"{last.timestamp.isoformat()}:{last.id}"

    return {"items": records, "next_cursor": next_cursor, "has_more": has_more}
