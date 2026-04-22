import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer, IterativeImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
import os
import pickle
from sklearn.svm import SVC
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import VotingClassifier

df = pd.read_csv("./data/diabetes.csv")
df1 = df.copy()


df_zero_values = df[["Glucose", "BMI", "BloodPressure"]]
median_imputer = SimpleImputer(strategy="median")
df_zero_values = df_zero_values.replace(0, np.nan)
df_zero_values_imputed = pd.DataFrame(
    median_imputer.fit_transform(df_zero_values), columns=df_zero_values.columns
)

df[["Glucose", "BMI", "BloodPressure"]] = df_zero_values_imputed

features = ["Glucose", "BMI", "Insulin", "SkinThickness", "BloodPressure"]
df1[features] = df1[features].replace(0, np.nan)

mice_inputer = IterativeImputer(max_iter=10, random_state=111)
imputed = mice_inputer.fit_transform(df1[features])

df1[features] = imputed
col_length = int(df1.columns.drop("Outcome").shape[0] / 2)

df_corr = df1.corr()
df_corr
top_5_corr = df_corr.nlargest(5, "Outcome")
top_5_corr["Outcome"]


result = []
x = df1[["Glucose", "Insulin", "BMI", "SkinThickness", "Age"]]
y = df1.iloc[:, 8]

log_regress = LogisticRegression()
log_regress_score = cross_val_score(log_regress, x, y, cv=10, scoring="recall").mean()

result.append(log_regress_score)

rf_class = RandomForestClassifier()
rf_class_score = cross_val_score(rf_class, x, y, cv=10, scoring="recall").mean()

cv_scores = []
folds = 10

ks = list(range(1, int(len(x) * ((folds - 1) / folds)), 2))

for k in ks:
    knn = KNeighborsClassifier(n_neighbors=k)
    score = cross_val_score(knn, x, y, cv=folds, scoring="recall").mean()
    cv_scores.append(score)

knn_score = max(cv_scores)

best_k = ks[cv_scores.index(knn_score)]
result.append(knn_score)


kernels = ["linear", "rbf"]

for kernel in kernels:
    svm_model = SVC(kernel=kernel)
    svm_score = cross_val_score(svm_model, x, y, cv=10, scoring="recall").mean()
    result.append(svm_score)


rf_tuned = RandomForestClassifier(
    n_estimators=100, max_depth=4, class_weight="balanced", random_state=42
)
xgb_tuned = XGBClassifier(
    n_estimators=100,
    max_depth=4,
    scale_pos_weight=(y == 0).sum() / (y == 1).sum(),
    random_state=42,
)

rf_tuned_score = cross_val_score(rf_tuned, x, y, cv=10, scoring="recall").mean()
xgb_tuned_score = cross_val_score(xgb_tuned, x, y, cv=10, scoring="recall").mean()

result.append(rf_tuned_score)
result.append(xgb_tuned_score)

model_columns = ["Log_reg", "KNN", "SVM_Linear", "SVM_rbf", "RF", "XG"]
df_model_scores = pd.DataFrame(result, index=model_columns)

X = df1.drop(columns="Outcome")
y = df1["Outcome"]
y.value_counts()


smote = SMOTE(random_state=42)
X_resampled, y_resampled = smote.fit_resample(X, y)

X_train, X_test, y_train, y_test = train_test_split(
    X_resampled, y_resampled, test_size=0.2, random_state=42
)

rf_classifier = RandomForestClassifier(
    n_estimators=100,
    max_depth=4,
    class_weight="balanced",
    random_state=42,
    criterion="gini",
)

rf_classifier.fit(X_train, y_train)

y_pred_rf = rf_classifier.predict(X_test)


clf2 = RandomForestClassifier(
    random_state=42, n_estimators=100, max_depth=4, class_weight="balanced"
)
clf3 = XGBClassifier(eval_metric="logloss", random_state=42, n_estimators=100)

ensemble = VotingClassifier(estimators=[("rf", clf2), ("xgb", clf3)], voting="soft")

ensemble_score = cross_val_score(
    ensemble, X_resampled, y_resampled, cv=10, scoring="recall"
).mean()
print(f"Ensemble Recall: {ensemble_score:.3f}")


ensemble.fit(X_train, y_train)

y_pred_rf = ensemble.predict(X_test)


# SMOTE with Random Forest alone performed with the recall metric. This is the most important metric for this use case.

feature_importances = pd.Series(rf_classifier.feature_importances_, index=X.columns)

filename = "diabetes.sav"
filename = os.path.join("model", filename)
with open(filename, "wb") as f:
    pickle.dump(rf_classifier, f)
