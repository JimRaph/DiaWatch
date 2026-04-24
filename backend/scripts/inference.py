import logging
from typing import Tuple, List, Dict, Any, Optional

import mlflow
import mlflow.pyfunc
import pandas as pd
import numpy as np
import shap
from catboost import CatBoostClassifier
from sklearn.experimental import enable_iterative_imputer  # noqa: F401
from sklearn.impute import IterativeImputer

logger = logging.getLogger(__name__)


class InferenceError(Exception):
    """exception for inference failures."""

    pass


class InferenceEngine:
    """
    inference engine.
    model loading, imputation, prediction, and SHAP explanations.
    """

    NUMERIC_FEATURES = ["age", "bmi", "waist_circumference"]
    CATEGORICAL_FEATURES = ["gender", "race_ethnicity", "is_pregnant", "family_history"]

    THRESHOLDS = {"prediabetes": 0.40, "diabetes": 0.34}

    def __init__(self, model_name: str, stage: str = "production"):
        self.model_name = model_name
        self.stage = stage
        self.model: Optional[CatBoostClassifier] = None
        self.imputer: Optional[IterativeImputer] = None
        self.explainer: Optional[shap.TreeExplainer] = None
        self.model_version: Optional[str] = None
        self.feature_names: List[str] = []
        self._ready = False

    def load(self) -> None:
        """loading model and artifacts from MLflow."""
        try:
            logger.info(f"laoding model {self.model_name} stage={self.stage}")

            model_uri = f"models:/{self.model_name}@{self.stage}"
            pyfunc_model = mlflow.pyfunc.load_model(model_uri)

            python_model = pyfunc_model.unwrap_python_model()
            self.model = python_model.model
            self.imputer = python_model.imputer
            self.model_version = self._get_model_version()

            self.feature_names = list(self.model.feature_names_)
            self.explainer = shap.TreeExplainer(self.model)

            self._ready = True
            logger.info(f"Model loaded successfully. Version: {self.model_version}")

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self._ready = False
            raise InferenceError(f"Model loading failed: {str(e)}")

    def is_ready(self) -> bool:
        return self._ready and self.model is not None

    def get_model_version(self) -> str:
        return self.model_version or "unknown"

    def validate_input(self, data: Dict[str, Any]) -> None:
        """check input data matches schema."""
        all_features = self.NUMERIC_FEATURES + self.CATEGORICAL_FEATURES
        missing = [f for f in all_features if f not in data]
        if missing:
            raise InferenceError(f"Missing required features: {missing}")

        for feat in self.NUMERIC_FEATURES:
            val = data[feat]
            if val is not None and not isinstance(val, (int, float, np.number)):
                raise InferenceError(f"Feature {feat} must be numeric, got {type(val)}")

    def _to_scalar(self, value: Any) -> Any:

        if isinstance(value, np.ndarray):
            return value.item() if value.size == 1 else None
        if isinstance(value, list):
            return value[0] if len(value) == 1 else None
        if isinstance(value, np.generic):
            return value.item()
        return value

    def _sanitize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            key: str(value) if key in self.CATEGORICAL_FEATURES else float(value)
            for key, value in data.items()
        }

    def predict(
        self, data: Dict[str, Any]
    ) -> Tuple[int, np.ndarray, List[Dict[str, Any]]]:

        if not self.is_ready():
            raise InferenceError("Engine not initialized")

        self.validate_input(data)

        data = self._sanitize_data(data)

        try:
            df = pd.DataFrame([data])
            df = df[self.feature_names]

            for cat_col in self.CATEGORICAL_FEATURES:
                if cat_col in df.columns:
                    df[cat_col] = df[cat_col].astype(str)

            df_imputed = df.copy()
            numeric_data = df[self.NUMERIC_FEATURES].copy()

            if numeric_data.isnull().any().any():
                imputed_values = self.imputer.transform(numeric_data)
                if imputed_values.ndim > 1:
                    df_imputed[self.NUMERIC_FEATURES] = (
                        imputed_values[0]
                        if len(imputed_values) == 1
                        else imputed_values
                    )
                else:
                    df_imputed[self.NUMERIC_FEATURES] = imputed_values

            probabilities = self.model.predict_proba(df_imputed)[0]
            logger.info(f"Probabilities: {probabilities}")

            pred_class = self._apply_thresholds(probabilities)
            logger.info(f"Predicted class: {pred_class}")

            shap_values = self.explainer.shap_values(df_imputed)
            shap_array = np.array(shap_values)
            class_shap = shap_array[0, :, pred_class]

            explanations = []
            for i, col in enumerate(self.feature_names):
                impact = float(self._to_scalar(class_shap[i]))
                explanations.append(
                    {"feature": col, "impact": impact, "value": data.get(col)}
                )

            return pred_class, probabilities, explanations

        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise InferenceError(f"Prediction failed: {str(e)}")

    def _apply_thresholds(self, probabilities: np.ndarray) -> int:
        if probabilities[2] >= self.THRESHOLDS["diabetes"]:
            return 2
        if probabilities[1] >= self.THRESHOLDS["prediabetes"]:
            return 1
        return 0

    def _get_model_version(self) -> str:
        try:
            client = mlflow.tracking.MlflowClient()

            model_info = client.get_model_version_by_alias(
                name=self.model_name, alias=self.stage
            )
            return model_info.version
        except Exception as e:
            logger.warning(f"Could not fetch model version: {e}")
            return "unknown"
