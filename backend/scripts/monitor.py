import os
from dotenv import load_dotenv
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
import mlflow
from mlflow.tracking import MlflowClient

from evidently import Report, DataDefinition, Dataset
from evidently.presets import DataDriftPreset, DataSummaryPreset, ClassificationPreset
from evidently.metrics import ValueDrift
from evidently import MulticlassClassification

from database import DATABASE_URL
from database import MonitorStore

load_dotenv()


logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


cache_dir = os.getenv("MONITOR_CACHE_DIR", "./monitoring_cache")


class MonitoringError(Exception):
    pass


class DiaWatchMonitor:
    def __init__(self):
        self.engine = create_engine(DATABASE_URL)
        self.mlflow_tracking_uri = os.getenv("MLFLOW_TRACKING_URI")
        self.model_name = os.getenv("MLFLOW_MODEL_NAME")
        self.min_samples_drift = int(os.getenv("MIN_SAMPLES_DRIFT", "3"))
        self.min_samples_performance = int(os.getenv("MIN_SAMPLES_PERFORMANCE", "3"))

        mlflow.set_tracking_uri(self.mlflow_tracking_uri)

    def _prepare_df(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df

        cat_cols = [
            "gender",
            "race_ethnicity",
            "is_pregnant",
            "family_history",
            "prediction",
            "target",
        ]
        num_cols = ["age", "bmi", "waist_circumference"]

        for col in cat_cols:
            if col in df.columns:
                df[col] = (
                    df[col]
                    .astype(str)
                    .replace(["None", "nan", "NaN"], pd.NA)
                    .astype("category")
                )

        for col in num_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        return df

    def mark_as_processed(self, ids: list):
        if not ids:
            return
        with Session(self.engine) as session:
            session.query(MonitorStore).filter(MonitorStore.id.in_(ids)).update(
                {"processed_for_monitoring": True}, synchronize_session=False
            )
            session.commit()

    def fetch_reference_data(self) -> pd.DataFrame:
        print("pringing")
        logging.info("printing")
        logging.warning("panting")
        client = MlflowClient()
        version = client.get_model_version_by_alias(self.model_name, "production")
        if not version:
            raise MonitoringError(f"No production model found for {self.model_name}")

        version_num = version.version
        run_id = version.run_id

        version_cache_dir = os.path.join(cache_dir, self.model_name, version_num)
        os.makedirs(version_cache_dir, exist_ok=True)
        cache_file_path = os.path.join(version_cache_dir, "reference_data.parquet")

        if os.path.exists(cache_file_path):
            logger.info(f"Loaded reference data from cache for version {version_num}")
            df = pd.read_parquet(cache_file_path)
            return self._prepare_df(df)

        logger.info(f"Downloading reference data from MLflow run {run_id}")
        artifact_path = client.download_artifacts(run_id, "reference_data")
        reference_file = os.path.join(artifact_path, "reference_data.parquet")

        if not os.path.exists(reference_file):
            raise MonitoringError(
                "Critical error: reference_data.parquet not found in MLflow artifacts."
            )

        df = pd.read_parquet(reference_file)
        df.to_parquet(cache_file_path)
        return self._prepare_df(df)

    def get_training_metrics(self) -> Dict[str, float]:
        client = MlflowClient()
        version = client.get_model_version_by_alias(self.model_name, "production")
        if not version:
            return {}
        return client.get_run(version.run_id).data.metrics

    def fetch_drift_data(self, days: int = 30) -> pd.DataFrame:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

        with Session(self.engine) as session:
            query = session.query(
                MonitorStore.age,
                MonitorStore.bmi,
                MonitorStore.waist_circumference,
                MonitorStore.gender,
                MonitorStore.race_ethnicity,
                MonitorStore.is_pregnant,
                MonitorStore.family_history,
                MonitorStore.prediction,
                MonitorStore.prob_0,
                MonitorStore.prob_1,
                MonitorStore.prob_2,
            ).filter(
                MonitorStore.timestamp >= cutoff_date,
                MonitorStore.model_version.isnot(None),
            )
            df = pd.read_sql(query.statement, session.bind)

            if not df.empty:
                df = df.rename(columns={"prob_0": "0", "prob_1": "1", "prob_2": "2"})
                logger.info(f"Loaded {len(df)} samples for drift analysis.")
            return self._prepare_df(df)

    def fetch_performance_data(self, days: int = 60) -> pd.DataFrame:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

        with Session(self.engine) as session:
            query = session.query(
                MonitorStore.age,
                MonitorStore.bmi,
                MonitorStore.waist_circumference,
                MonitorStore.gender,
                MonitorStore.race_ethnicity,
                MonitorStore.is_pregnant,
                MonitorStore.family_history,
                MonitorStore.prediction,
                MonitorStore.prob_0,
                MonitorStore.prob_1,
                MonitorStore.prob_2,
                MonitorStore.actual,
                MonitorStore.timestamp,
                MonitorStore.feedback_timestamp,
            ).filter(
                MonitorStore.actual.isnot(None), MonitorStore.timestamp >= cutoff_date
            )
            df = pd.read_sql(query.statement, session.bind)

            if not df.empty:
                df = df.rename(
                    columns={
                        "actual": "target",
                        "prob_0": "0",
                        "prob_1": "1",
                        "prob_2": "2",
                    }
                )

                df["feedback_delay"] = pd.to_datetime(
                    df["feedback_timestamp"]
                ) - pd.to_datetime(df["timestamp"])
                df = df[df["feedback_delay"] <= pd.Timedelta(days=14)]
                df = df.drop(
                    columns=["timestamp", "feedback_timestamp", "feedback_delay"]
                )

            logger.info(f"Loaded {len(df)} samples with ground truth.")
            return self._prepare_df(df)

    def run_monitoring_suite(
        self, drift_days: int = 30, perf_days: int = 60
    ) -> Dict[str, Any]:
        try:
            reference_df = self.fetch_reference_data()
            training_metrics = self.get_training_metrics()

            if (
                "prediction" not in reference_df.columns
                and "target" in reference_df.columns
            ):
                reference_df["prediction"] = reference_df["target"]

            results = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "reference_samples": len(reference_df),
                "drift": {"status": "skipped"},
                "performance": {"status": "skipped"},
            }
            print(f"\n\n Reference df: \n\n {reference_df.columns} \n\n Loaded")
            print(f"\n\n Reference df target: \n\n {reference_df['target'].unique()}")
            print(
                f"\n\n Reference df prediction: \n\n {reference_df['prediction'].unique()}"
            )

            data_def = DataDefinition(
                numerical_columns=["age", "bmi", "waist_circumference"],
                datetime=["timestamp", "feedback_timestamp"],
                categorical_columns=[
                    "gender",
                    "race_ethnicity",
                    "is_pregnant",
                    "family_history",
                ],
                classification=[
                    MulticlassClassification(
                        target="target",
                        prediction_labels="prediction",
                        prediction_probas=["0", "1", "2"],
                        labels={"0": "healthy", "1": "prediabetes", "2": "diabetes"},
                    )
                ],
            )

            drift_df = self.fetch_drift_data(drift_days)
            print(f"\n\n Drift df: \n\n {drift_df.columns} \n\n Loaded")
            # print(f"\n\n Drift df target: \n\n {drift_df['target'].unique()}")
            print(f"\n\n Drift df prediction: \n\n {drift_df['prediction'].unique()}")
            if not drift_df.empty and len(drift_df) < self.min_samples_drift:
                logger.warning(
                    f"Not enough data for drift analysis: {len(drift_df)} samples"
                )
            elif len(drift_df) >= self.min_samples_drift:
                if "target" not in drift_df.columns:
                    drift_df["target"] = pd.NA

                if "target" in reference_df.columns:
                    drift_df["target"] = drift_df["target"].astype(
                        pd.CategoricalDtype(
                            categories=reference_df["target"].cat.categories
                        )
                    )

                metrics = [
                    DataDriftPreset(),
                    DataSummaryPreset(),
                    ValueDrift(column="age", method="wasserstein"),
                    ValueDrift(column="bmi", method="wasserstein"),
                    ValueDrift(column="waist_circumference", method="wasserstein"),
                ]
                print("random log to check")
                ref_ds = Dataset.from_pandas(reference_df, data_definition=data_def)
                cur_ds = Dataset.from_pandas(drift_df, data_definition=data_def)

                report = Report(metrics=metrics)
                drift_result = report.run(reference_data=ref_ds, current_data=cur_ds)

                print("random log to check 2")
                report_dict = drift_result.dict()
                metric_results = [
                    m.get("result", {}) for m in report_dict.get("metrics", [])
                ]
                drift_summary = next(
                    (m for m in metric_results if "share_of_drifted_columns" in m), {}
                )
                print("random log to check 3")
                results["drift"] = {
                    "status": "success",
                    "production_samples": len(drift_df),
                    "is_drifting": drift_summary.get("dataset_drift", False),
                    "drift_share": drift_summary.get("share_of_drifted_columns", 0),
                    "drifted_columns": drift_summary.get(
                        "number_of_drifted_columns", 0
                    ),
                }

                self._save_report(drift_result, "drift", drift_days, results)

                if results["drift"]["is_drifting"]:
                    self._send_alert(results, "Data Drift Detected")

            perf_df = self.fetch_performance_data(perf_days)
            print(f"\n\n Performance data: \n\n {perf_df.columns} \n\n Loaded")
            print(f"perf_df: {len(perf_df)}")
            if not perf_df.empty and len(perf_df) < self.min_samples_performance:
                logger.warning(
                    f"Not enough data for performance analysis: {len(perf_df)} samples"
                )
            elif perf_df.empty:
                logger.warning("No data for performance analysis")
            elif len(perf_df) >= self.min_samples_performance:
                print("random log to check 4")
                ref_perf_ds = Dataset.from_pandas(
                    reference_df.dropna(subset=["target"]), data_definition=data_def
                )
                cur_perf_ds = Dataset.from_pandas(perf_df, data_definition=data_def)

                perf_report = Report(metrics=[ClassificationPreset()])
                perf_result = perf_report.run(
                    reference_data=ref_perf_ds, current_data=cur_perf_ds
                )

                perf_dict = perf_result.dict()
                current_metrics = {}
                for m in perf_dict.get("metrics", []):
                    if (
                        "current" in m.get("result", {})
                        and "f1" in m["result"]["current"]
                    ):
                        current_metrics = m["result"]["current"]
                        break

                current_f1 = current_metrics.get("f1", 0)
                baseline_f1 = training_metrics.get("macro_f1", 0)

                results["performance"] = {
                    "status": "success",
                    "feedback_samples": len(perf_df),
                    "accuracy": current_metrics.get("accuracy", 0),
                    "f1_score": current_f1,
                    "baseline_f1": baseline_f1,
                    "f1_degradation": baseline_f1 - current_f1,
                }
                print(f"RESULTS: {results}")
                self._save_report(perf_result, "performance", perf_days, results)

                if (baseline_f1 - current_f1) > 0.10:
                    self._send_alert(
                        results,
                        f"Performance Drop! F1 degraded by {round((baseline_f1 - current_f1) * 100)}%",
                    )

            return {"status": "success", "results": results}

        except Exception as e:
            logger.exception(f"Monitoring suite failed: {e}")
            return {"status": "error", "message": str(e)}

    def _save_report(
        self, report: Report, analysis_type: str, days: int, metadata: Dict
    ):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = os.getenv("MONITORING_OUTPUT_DIR", "/tmp/monitoring")
        os.makedirs(output_dir, exist_ok=True)

        report_path = os.path.join(
            output_dir, f"report_{analysis_type}_{days}d_{timestamp}.html"
        )
        json_path = os.path.join(
            output_dir, f"results_{analysis_type}_{days}d_{timestamp}.json"
        )

        report.save_html(report_path)
        with open(json_path, "w") as f:
            json.dump(metadata, f, indent=2)

        logger.info(f"Saved {analysis_type} report: {report_path}")

    def _send_alert(self, results: Dict[str, Any], title: str):
        webhook_url = os.getenv("WEBHOOK_URL")
        if not webhook_url:
            return

        try:
            import requests

            payload = {
                "text": f"DiaWatch Monitor Alert: {title}",
                "timestamp": results.get("timestamp"),
                "metrics": results,
                "action_required": "Review recent model metrics immediately.",
            }
            requests.post(webhook_url, json=payload, timeout=5).raise_for_status()
            logger.info(f"Alert webhook fired: {title}")
        except Exception as e:
            logger.error(f"Failed to send webhook: {e}")


def run_scheduled_monitoring():
    monitor = DiaWatchMonitor()
    result = monitor.run_monitoring_suite(drift_days=30, perf_days=60)

    print(json.dumps(result, indent=2))
    if result.get("status") == "error":
        exit(1)
    exit(0)


if __name__ == "__main__":
    run_scheduled_monitoring()
