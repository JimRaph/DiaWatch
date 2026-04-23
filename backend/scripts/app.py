import os
import contextvars
from uuid6 import uuid7
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mlflow

from database import init_db
from schema import HealthResponse
from inference import InferenceEngine
from auth import router as auth_router
from endpoints import router as endpoints_router

request_id_context = contextvars.ContextVar("request_id", default="N/A")


MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI")
MLFLOW_MODEL_NAME = os.getenv("MLFLOW_MODEL_NAME", "DiaWatch_Medical_System")
# CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
CORS_ORIGINS = os.getenv("CORS_ORIGINSS", "http://localhost:3000")


class RequestIdFilter(logging.Filter):
    """Pulls the request_id from the async context variable."""

    def filter(self, record):
        record.request_id = request_id_context.get()
        return True


root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

root_logger.handlers.clear()

handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s"
)
handler.setFormatter(formatter)
handler.addFilter(RequestIdFilter())
root_logger.addHandler(handler)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown."""

    logger.info("Starting up DiaWatch API...")

    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

    try:
        engine = InferenceEngine(model_name=MLFLOW_MODEL_NAME, stage="production")
        engine.load()
        app.state.inference_engine = engine
        logger.info("Inference engine loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load inference engine: {e}")
        app.state.inference_engine = None

    yield

    logger.info("...DiaWatch API is shutting down...")


app = FastAPI(
    title="DiaWatch Production API",
    description="Diabetes screening with ML inference and LLM recommendations",
    version="2.0.0",
    lifespan=lifespan,
)

app.include_router(auth_router)
app.include_router(endpoints_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """middleware to attach unique request ID for tracing"""
    request_id = str(uuid7())
    request.state.request_id = request_id

    token = request_id_context.set(request_id)

    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
    finally:
        request_id_context.reset(token)


@app.get("/health", response_model=HealthResponse)
async def health_check(request: Request):

    inference_engine = request.app.state.inference_engine

    if inference_engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "model_loaded": False,
                "version": "unknown",
                "error": "Inference engine not initialized",
            },
        )

    if not inference_engine.is_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "unhealthy",
                "model_loaded": False,
                "version": inference_engine.get_model_version(),
                "error": "Model failed to load",
            },
        )

    return HealthResponse(
        status="healthy",
        model_loaded=True,
        version=inference_engine.get_model_version(),
    )


@app.get("/")
async def root():
    return "<h1>DiaWatch Production API</h1><p>Diabetes screening with ML inference and LLM recommendations</p>"


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
