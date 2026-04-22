import os
import logging

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Boolean,
    Float,
    DateTime,
    JSON,
    func,
    ForeignKey,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.pool import NullPool

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://diawatch:diawatch@db:5432/diawatch"
)
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


engine = create_engine(DATABASE_URL, poolclass=NullPool, pool_pre_ping=True, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    predictions = relationship("PredictionStore", back_populates="owner")


class PredictionStore(Base):
    __tablename__ = "predictions"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=func.now(), index=True)

    clinical_inputs = Column(JSON, nullable=False)
    lifestyle_inputs = Column(JSON, nullable=True)
    health_note = Column(String, nullable=True)

    prediction_class = Column(Integer, nullable=False)
    prediction_label = Column(String, nullable=False)
    confidence_scores = Column(JSON, nullable=False)
    shap_explanations = Column(JSON, nullable=False)
    model_version = Column(String, nullable=False)

    actual_class = Column(Integer, nullable=True)
    feedback_timestamp = Column(DateTime(timezone=True), nullable=True)
    verification_status = Column(String, nullable=True, default="pending", index=True)

    personalized_report = Column(JSON, nullable=True)
    top_risk_factors = Column(JSON, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner = relationship("User", back_populates="predictions")
    guest_id = Column(String, index=True, nullable=True)
    is_guest = Column(Boolean, default=True)

    processed_for_monitoring = Column(Integer, default=0)


class MonitorStore(Base):
    __tablename__ = "monitoring_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(String, index=True)
    timestamp = Column(DateTime(timezone=True), default=func.now(), index=True)

    age = Column(Float)
    bmi = Column(Float)
    waist_circumference = Column(Float)
    gender = Column(String)
    race_ethnicity = Column(String)
    is_pregnant = Column(String)
    family_history = Column(String)

    prediction = Column(Integer)
    actual = Column(Integer, nullable=True)
    feedback_timestamp = Column(DateTime(timezone=True), nullable=True)
    model_version = Column(String)
    is_guest = Column(Boolean, default=True)
    guest_id = Column(String, nullable=True)
    prob_0 = Column(Float)
    prob_1 = Column(Float)
    prob_2 = Column(Float)


def init_db() -> None:
    """initialize database tables."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("tables initialized")
    except Exception as e:
        logger.error(f"db initialization failed: {e}")
        raise


def get_db() -> Session:
    """Dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def log_prediction_for_monitoring(db: Session, prediction: PredictionStore) -> None:
    """
    Copy prediction data to monitoring table in denormalized form.
    """
    try:
        clinical = prediction.clinical_inputs
        scores = prediction.confidence_scores
        monitor_entry = MonitorStore(
            prediction_id=prediction.id,
            timestamp=prediction.timestamp,
            age=clinical.get("age"),
            bmi=clinical.get("bmi"),
            waist_circumference=clinical.get("waist_circumference"),
            gender=clinical.get("gender"),
            race_ethnicity=clinical.get("race_ethnicity"),
            is_pregnant=clinical.get("is_pregnant"),
            family_history=clinical.get("family_history"),
            prediction=prediction.prediction_class,
            actual=prediction.actual_class,
            model_version=prediction.model_version,
            is_guest=prediction.is_guest,
            guest_id=prediction.guest_id,
            prob_0=scores.get("healthy"),
            prob_1=scores.get("prediabetes"),
            prob_2=scores.get("diabetes"),
        )

        db.add(monitor_entry)
        prediction.processed_for_monitoring = 1
        db.commit()

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to log to monitoring table: {e}")
