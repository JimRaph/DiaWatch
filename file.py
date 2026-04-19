import os
import numpy as np
import pandas as pd
import mlflow
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score
from sklearn.utils.class_weight import compute_class_weight

# Ray Tune & MLflow Integration
import ray
from ray import tune
from ray.air.integrations.mlflow import MLflowLoggerCallback

# Models
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier
from imblearn.ensemble import BalancedRandomForestClassifier
from pytorch_tabnet.tab_model import TabNetClassifier

# ---------------------------------------------------------
# 1. Data Preparation & Class Weights
# ---------------------------------------------------------
# Assuming 'new_data' is your cleaned DataFrame and 'target' is your label
X = new_data.drop(columns=['target'])
y = new_data['target'].astype(int)

X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

# Compute dynamic class weights for the imbalanced distribution
weights = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
class_weights_dict = dict(enumerate(weights))

# Convert to list for models that require a list/array (like LightGBM/CatBoost)
class_weights_array = [class_weights_dict[i] for i in range(len(weights))]

# ---------------------------------------------------------
# 2. The Unified Ray Tune Training Function
# ---------------------------------------------------------
def train_evaluate_model(config):
    model_name = config["model_name"]
    
    # --- Model Selection & Initialization ---
    if model_name == "XGBoost":
        model = XGBClassifier(
            max_depth=config["max_depth"],
            learning_rate=config["learning_rate"],
            n_estimators=config["n_estimators"],
            class_weight=class_weights_dict,
            random_state=42,
            n_jobs=1 # Ray handles parallelization
        )
    elif model_name == "LightGBM":
        model = LGBMClassifier(
            num_leaves=config["num_leaves"],
            learning_rate=config["learning_rate"],
            n_estimators=config["n_estimators"],
            class_weight=class_weights_dict,
            random_state=42,
            n_jobs=1
        )
    elif model_name == "CatBoost":
        model = CatBoostClassifier(
            depth=config["depth"],
            learning_rate=config["learning_rate"],
            iterations=config["iterations"],
            class_weights=class_weights_array,
            verbose=0,
            random_state=42
        )
    elif model_name == "BalancedRF":
        model = BalancedRandomForestClassifier(
            n_estimators=config["n_estimators"],
            max_depth=config["max_depth"],
            random_state=42,
            n_jobs=1
        )
    elif model_name == "TabNet":
        model = TabNetClassifier(
            n_d=config["n_d"],
            n_a=config["n_d"], # Usually n_d == n_a is a good default
            n_steps=config["n_steps"],
            gamma=config["gamma"],
            optimizer_params={'lr': config["learning_rate"]},
            verbose=0
        )
    
    # --- Training Execution ---
    if model_name == "TabNet":
        # TabNet requires pure NumPy arrays, no DataFrames
        model.fit(
            X_train=X_train.values, y_train=y_train.values,
            eval_set=[(X_val.values, y_val.values)],
            eval_metric=['auc'],
            max_epochs=config["epochs"],
            patience=5,
            batch_size=1024
        )
        preds = model.predict(X_val.values)
    else:
        # Standard Scikit-Learn API for the Tree models
        model.fit(X_train, y_train)
        preds = model.predict(X_val)
    
    # --- Evaluation ---
    # We use Macro F1 because of the 8373 vs 3586 imbalance
    macro_f1 = f1_score(y_val, preds, average='macro')
    
    # Report metric back to Ray Tune
    tune.report(macro_f1=macro_f1)

# ---------------------------------------------------------
# 3. Define the Search Space (Hyperparameters)
# ---------------------------------------------------------
search_space = tune.choice([
    {
        "model_name": "XGBoost",
        "max_depth": tune.randint(3, 10),
        "learning_rate": tune.loguniform(1e-3, 0.3),
        "n_estimators": tune.choice([100, 300, 500])
    },
    {
        "model_name": "LightGBM",
        "num_leaves": tune.randint(20, 150),
        "learning_rate": tune.loguniform(1e-3, 0.3),
        "n_estimators": tune.choice([100, 300, 500])
    },
    {
        "model_name": "CatBoost",
        "depth": tune.randint(4, 10),
        "learning_rate": tune.loguniform(1e-3, 0.3),
        "iterations": tune.choice([100, 300, 500])
    },
    {
        "model_name": "BalancedRF",
        "max_depth": tune.randint(5, 20),
        "n_estimators": tune.choice([100, 300, 500])
    },
    {
        "model_name": "TabNet",
        "n_d": tune.choice([8, 16, 24]),
        "n_steps": tune.randint(3, 6),
        "gamma": tune.uniform(1.0, 2.0),
        "learning_rate": tune.loguniform(1e-3, 1e-1),
        "epochs": tune.choice([50, 100])
    }
])

# ---------------------------------------------------------
# 4. Execute Ray Tune with MLflow
# ---------------------------------------------------------
if __name__ == "__main__":
    ray.init(ignore_reinit_error=True)
    
    # Configure MLflow tracking
    mlflow_callback = MLflowLoggerCallback(
        tracking_uri="file:./mlruns",  # Saves logs to a local folder
        experiment_name="NHANES_Diabetes_African_Phenotype",
        save_artifact=True
    )
    
    tuner = tune.Tuner(
        train_evaluate_model,
        param_space=search_space,
        tune_config=tune.TuneConfig(
            metric="macro_f1",
            mode="max",
            num_samples=20, # Number of total trials to run. Increase for deeper search.
        ),
        run_config=ray.air.RunConfig(
            name="diabetes_model_shootout",
            callbacks=[mlflow_callback]
        )
    )
    
    results = tuner.fit()
    
    print("\n" + "="*50)
    print("BEST MODEL FOUND:")
    print(results.get_best_result(metric="macro_f1", mode="max").config)
    print("="*50)
    
    ray.shutdown()