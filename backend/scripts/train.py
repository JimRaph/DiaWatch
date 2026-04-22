import os
from dotenv import load_dotenv
import logging
import pickle
from datetime import datetime
from typing import Tuple, Dict, Any

import sklearn
import catboost
import pandas as pd
import numpy as np
import mlflow
import mlflow.catboost
import mlflow.pyfunc
from mlflow.models.signature import infer_signature
from sklearn.impute import IterativeImputer
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)
from sklearn.utils.class_weight import compute_class_weight
from catboost import CatBoostClassifier
import evidently
import shap

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DiaWatch_Training")


class DiaWatchModel(mlflow.pyfunc.PythonModel):
    """
    model wrapper for handling all imputation and thresholding.
    """

    THRESHOLDS = {"prediabetes": 0.40, "diabetes": 0.34}
    NUMERIC_COLS = ["bmi", "waist_circumference", "age"]

    def load_context(self, context):
        """get model and imputer from artifacts."""
        imputer_path = context.artifacts.get("imputer")
        if not imputer_path or not os.path.exists(imputer_path):
            raise FileNotFoundError(f"Imputer not found at {imputer_path}")

        with open(imputer_path, "rb") as f:
            self.imputer = pickle.load(f)

        model_path = context.artifacts.get("catboost_model")
        if model_path and os.path.exists(model_path):
            self.model = CatBoostClassifier()
            self.model.load_model(model_path)
        else:
            try:
                catboost_artifact_path = context.artifacts.get("catboost_model_dir")
                if catboost_artifact_path:
                    self.model = mlflow.catboost.load_model(catboost_artifact_path)
                else:
                    raise FileNotFoundError("No catboost model artifact found")
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                raise RuntimeError(f"Could not load CatBoost model: {e}")

    def predict(self, context, model_input: pd.DataFrame):

        df = model_input.copy()

        missing_cols = [col for col in self.NUMERIC_COLS if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")

        df[self.NUMERIC_COLS] = self.imputer.transform(df[self.NUMERIC_COLS])

        cat_features = ["gender", "race_ethnicity", "is_pregnant", "family_history"]
        for col in cat_features:
            if col in df.columns:
                df[col] = df[col].astype(str)

        probs = self.model.predict_proba(df)

        # apply custom thresholds
        predictions = np.zeros(len(probs), dtype=int)

        diabetes_mask = probs[:, 2] >= self.THRESHOLDS["diabetes"]
        predictions[diabetes_mask] = 2

        prediabetes_mask = (
            probs[:, 1] >= self.THRESHOLDS["prediabetes"]
        ) & ~diabetes_mask
        predictions[prediabetes_mask] = 1

        return predictions


def load_and_prepare_data(data_path: str) -> Tuple[pd.DataFrame, pd.Series]:
    """Handles loading and validating of training data."""
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data not found: {data_path}")

    df = pd.read_csv(data_path)

    required_cols = [
        "gender",
        "race_ethnicity",
        "is_pregnant",
        "family_history",
        "age",
        "bmi",
        "waist_circumference",
        "target",
    ]

    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    X = df.drop("target", axis=1)
    y = df["target"]

    logger.info(f"Loaded data: {X.shape}, class distribution:\n{y.value_counts()}")
    return X, y


def train_and_evaluate(
    X: pd.DataFrame,
    y: pd.Series,
    export_dir: str,
    experiment_name: str = "DiaWatch_Production",
) -> Dict[str, Any]:
    """
    training pipeline with MLflow tracking.
    """

    mlflow_tracking_uri = os.getenv("MLFLOW_TRACKING_URI")
    # mlflow_tracking_uri = "https://dagshub.com/JimRaph/diawatch.mlflow"
    if mlflow_tracking_uri:
        mlflow.set_tracking_uri(mlflow_tracking_uri)
        logger.info(f"Using MLflow tracking URI: {mlflow_tracking_uri}")
    else:
        logger.warning("MLFLOW_TRACKING_URI not found. Logging locally.")
    if mlflow.active_run():
        mlflow.end_run()

    os.makedirs(export_dir, exist_ok=True)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    numeric_cols = ["bmi", "waist_circumference", "age"]
    imputer = IterativeImputer(max_iter=10, random_state=42)
    imputer.fit(X_train[numeric_cols])

    imputer_path = os.path.join(export_dir, "imputer.pkl")
    with open(imputer_path, "wb") as f:
        pickle.dump(imputer, f)

    X_train_imp = X_train.copy()
    X_test_imp = X_test.copy()
    X_train_imp[numeric_cols] = imputer.transform(X_train[numeric_cols])
    X_test_imp[numeric_cols] = imputer.transform(X_test[numeric_cols])
    cat_features = ["gender", "race_ethnicity", "is_pregnant", "family_history"]
    X_train_imp[cat_features] = X_train_imp[cat_features].astype(str)
    X_test_imp[cat_features] = X_test_imp[cat_features].astype(str)

    classes = np.unique(y_train)
    weights = compute_class_weight("balanced", classes=classes, y=y_train)
    class_weights = dict(zip(classes, weights))
    ordered_weights = [
        class_weights.get(0, 1.0),
        class_weights.get(1, 1.0),
        class_weights.get(2, 1.0),
    ]

    params = {
        "iterations": 150,
        "depth": 7,
        "learning_rate": 0.116,
        "class_weights": ordered_weights,
        "verbose": 0,
        "random_state": 42,
        "loss_function": "MultiClass",
        "eval_metric": "TotalF1:average=Macro",
    }

    mlflow.set_experiment(experiment_name)

    with mlflow.start_run(
        run_name=f"DiaWatch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    ):
        mlflow.log_params(params)
        mlflow.log_param("train_size", len(X_train))
        mlflow.log_param("test_size", len(X_test))

        model = CatBoostClassifier(**params)
        model.fit(
            X_train_imp,
            y_train,
            eval_set=(X_test_imp, y_test),
            cat_features=cat_features,
        )
        # model.feature_names_ = list(X_train_imp.columns)
        temp_catboost_path = os.path.join(export_dir, "model.cbm")
        model.save_model(temp_catboost_path)
        mlflow.catboost.log_model(model, "catboost_model")

        wrapper = DiaWatchModel()
        wrapper.model = model
        wrapper.imputer = imputer

        reference_data = X_train_imp.copy()
        reference_data["target"] = y_train

        train_probs = wrapper.model.predict_proba(X_train_imp)
        train_preds = wrapper.predict(None, X_train_imp)

        reference_data["prediction"] = train_preds
        reference_data["0"] = train_probs[:, 0]
        reference_data["1"] = train_probs[:, 1]
        reference_data["2"] = train_probs[:, 2]

        reference_data = reference_data[
            [
                "gender",
                "race_ethnicity",
                "is_pregnant",
                "family_history",
                "age",
                "bmi",
                "waist_circumference",
                "target",
                "prediction",
                "0",
                "1",
                "2",
            ]
        ]
        ref_path = os.path.join(export_dir, "reference_data.parquet")
        reference_data.to_parquet(ref_path)

        mlflow.log_artifact(ref_path, "reference_data")

        logger.info(f"Reference data saved: {len(reference_data)} samples")

        y_pred = wrapper.predict(None, X_test_imp)

        recalls = recall_score(y_test, y_pred, average=None)
        macro_recall = recall_score(y_test, y_pred, average="macro")
        macro_f1 = f1_score(y_test, y_pred, average="macro")

        report = classification_report(y_test, y_pred, output_dict=True)

        mlflow.log_metrics(
            {
                "macro_recall": macro_recall,
                "macro_f1": macro_f1,
                "recall_healthy": recalls[0],
                "recall_prediabetes": recalls[1],
                "recall_diabetes": recalls[2],
                "precision_macro": report["macro avg"]["precision"],
                "f1_diabetes": report["2"]["f1-score"],
            }
        )

        cm = confusion_matrix(y_test, y_pred)
        np.save(os.path.join(export_dir, "confusion_matrix.npy"), cm)
        mlflow.log_artifact(os.path.join(export_dir, "confusion_matrix.npy"))

        artifacts = {"catboost_model": temp_catboost_path, "imputer": imputer_path}

        signature = infer_signature(X_test, y_pred)

        model_info = mlflow.pyfunc.log_model(
            name="production_model",
            python_model=DiaWatchModel(),
            artifacts=artifacts,
            signature=signature,
            registered_model_name="DiaWatch_Medical_System",
            pip_requirements=[
                "google-genai",
                "google-api-core",
                f"catboost=={catboost.__version__}",
                f"scikit-learn=={sklearn.__version__}",
                f"pandas=={pd.__version__}",
                f"evidently=={evidently.__version__}",
                f"shap=={shap.__version__}",
                f"numpy=={np.__version__}",
                "scipy",
            ],
        )

        client = mlflow.tracking.MlflowClient()

        new_version = model_info.registered_model_version

        client.set_registered_model_alias(
            "DiaWatch_Medical_System", "production", new_version
        )

        logger.info(
            f"Training complete. Macro Recall: {macro_recall:.3f}, Macro F1: {macro_f1:.3f}"
        )

        return {
            "macro_recall": macro_recall,
            "macro_f1": macro_f1,
            "confusion_matrix": cm.tolist(),
            "export_dir": export_dir,
            "model_version": new_version,
        }


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "clean", "cleaned_nhanes_diabetes.csv")
    export_dir = os.path.join(
        base_dir, "exports", datetime.now().strftime("%Y%m%d_%H%M%S")
    )

    X, y = load_and_prepare_data(data_path)
    results = train_and_evaluate(X, y, export_dir)

    print(f"Training complete. Results: {results}")
