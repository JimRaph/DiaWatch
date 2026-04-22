import os
import pandas as pd
import requests
from typing import List, Dict
import logging
from io import BytesIO
import pyreadstat
import numpy as np
from sklearn.impute import IterativeImputer
from sklearn.model_selection import train_test_split


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# I decided to use the pre-covid data. On National Health and Nutrition Examination Survey
# website, there were changes in data collection in post-covid.
# In particular, no oversampling by race, income & hispanic origin leading to larger standard errors
# and wider confidence intervals for groups with fewer participants. There are other changes too

cycles = [("2013-2014", "H"), ("2015-2016", "I"), ("2017-2020", "P")]

base_url = "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/"

FILES = {
    "demographics": "DEMO",
    "examination": "BMX",
    "laboratory": {"glucose": "GLU", "hba1c": "GHB", "insulin": "INS"},
    "questionnaire": {
        "diabetes": "DIQ",
        "medical": "MCQ",
    },
}

RAW_DATA_DIR = "data/raw"
os.makedirs(RAW_DATA_DIR, exist_ok=True)


def download_files(
    cycle_year: str, cycle_code: str, file_code: str, file_type: str = "XPT"
) -> pd.DataFrame:

    if cycle_code == "P":
        filename = f"DataFiles/{cycle_code}_{file_code}"
    else:
        filename = f"DataFiles/{file_code}_{cycle_code}"

    local_filename = f"{file_code}_{cycle_code}.{file_type.upper()}"
    local_path = os.path.join(RAW_DATA_DIR, local_filename)

    if os.path.exists(local_path):
        logger.info(f"Loading {local_filename} from local cache...")
        try:
            df, _ = pyreadstat.read_xport(local_path, encoding="ISO-8859-1")
            df["cycle"] = cycle_year
            return df
        except Exception as e:
            logger.warning(f"Local file {local_filename} error: {repr(e)}")
    url = f"{base_url}{cycle_year}/{filename}.{file_type}"

    try:
        logger.info(f"downloading {url}")
        response = requests.get(url, timeout=120)
        response.raise_for_status()

        df, _ = pyreadstat.read_xport(BytesIO(response.content), encoding="ISO-8859-1")
        df["cycle"] = cycle_year

        logger.info(f"loaded {len(df)} rows from {file_code}_{cycle_code}")
        return df
    except Exception as e:
        logger.error(f"Failed to download {url}: {e}")
        return pd.DataFrame()


# def download_files(
#     cycle_year: str, cycle_code: str, file_code: str, file_type: str = "XPT"
# ) -> pd.DataFrame:
#     """Download and parse NHANES data files"""

#     if cycle_code == "P":
#         filename = f"DataFiles/{cycle_code}_{file_code}"
#     else:
#         filename = f"DataFiles/{file_code}_{cycle_code}"

#     local_filename = f"{file_code}_{cycle_code}.{file_type.upper()}"
#     local_path = os.path.join(RAW_DATA_DIR, local_filename)

#     url = f"{base_url}{cycle_year}/{filename}.{file_type}"
#     try:
#         logger.info(f"downloading {url}")
#         response = requests.get(url, timeout=120)
#         response.raise_for_status()

#         with open(local_path, "wb") as f:
#             f.write(response.content)

#         df, _ = pyreadstat.read_xport(BytesIO(response.content), encoding="ISO-8859-1")
#         df["cycle"] = cycle_year

#         logger.info(f"loaded {len(df)} rows from {file_code}_{cycle_code}")
#         return df
#     except Exception as e:
#         logger.error(f"Failed to download {url}: {repr(e)}")
#         return pd.DataFrame()


def load_cycles() -> Dict[str, List[pd.DataFrame]]:

    data = {
        "demographics": [],
        "body_measures": [],
        "glucose": [],
        "hba1c": [],
        "insulin": [],
        "family_history": [],
        "diabetes_q": [],
    }

    for year, code in cycles:
        logger.info(f"\n processing cycle {year}")
        year = year.split("-")[0]

        demo = download_files(year, code, FILES["demographics"])
        if not demo.empty:
            data["demographics"].append(demo)

        bmx = download_files(year, code, FILES["examination"])
        if not bmx.empty:
            data["body_measures"].append(bmx)

        glucose = download_files(year, code, FILES["laboratory"]["glucose"])
        if not glucose.empty:
            data["glucose"].append(glucose)

        hba1c = download_files(year, code, FILES["laboratory"]["hba1c"])
        if not hba1c.empty:
            data["hba1c"].append(hba1c)

        insulin = download_files(year, code, FILES["laboratory"]["insulin"])
        if not insulin.empty:
            data["insulin"].append(insulin)

        diabetes_q = download_files(year, code, FILES["questionnaire"]["diabetes"])
        if not diabetes_q.empty:
            data["diabetes_q"].append(diabetes_q)

        mcq = download_files(year, code, FILES["questionnaire"]["medical"])
        if not mcq.empty:
            data["family_history"].append(mcq)

    return data


# def merge_data(data: Dict[str, List[pd.DataFrame]]) -> pd.DataFrame:

#     logger.info("\n merging data")

#     demo = pd.concat(data["demographics"], ignore_index=True)
#     bmx = pd.concat(data["body_measures"], ignore_index=True)
#     glucose = pd.concat(data["glucose"], ignore_index=True)
#     hba1c = pd.concat(data["hba1c"], ignore_index=True)
#     diabetes_q = pd.concat(data["diabetes_q"], ignore_index=True)

#     logger.info(
#         f"demographics {len(demo)}, body: {len(bmx)}, glucose: {len(glucose)}, hba1c: {len(hba1c)}, diabetes: {len(diabetes_q)}"
#     )

#     df = demo[["SEQN", "RIAGENDR", "RIDAGEYR", "RIDRETH3", "cycle"]].copy()
#     df.columns = ["participant_id", "gender", "age", "race_ethnicity", "cycle"]

#     bmx_subset = bmx[["SEQN", "BMXBMI", "BMXWAIST"]].copy()
#     bmx_subset.columns = ["participant_id", "bmi", "waist_circumference"]
#     df = df.merge(bmx_subset, on="participant_id", how="left")

#     glucose_subset = glucose[["SEQN", "LBXGLU", "LBDGLUSI"]].copy()
#     glucose_subset.columns = ["participant_id", "glucose_mgdl", "glucose_mmol"]
#     df = df.merge(glucose_subset, on="participant_id", how="left")

#     hba1c_subset = hba1c[["SEQN", "LBXGH"]].copy()
#     hba1c_subset.columns = ["participant_id", "hba1c"]
#     df = df.merge(hba1c_subset, on="participant_id", how="left")

#     diabetes_q_subset = diabetes_q[["SEQN", "DIQ010", "DIQ040", "DIQ050"]].copy()
#     diabetes_q_subset.columns = [
#         "participant_id",
#         "diabetes_diagnosis",
#         "prediabetes",
#         "taking_insulin",
#     ]
#     df = df.merge(diabetes_q_subset, on="participant_id", how="left")

#     logger.info(f"Final merged dataset: {len(df)} participants")
#     return df


def merge_data(data: Dict[str, List[pd.DataFrame]]) -> pd.DataFrame:
    logger.info("\nMerging and transforming data...")

    def safe_concat(key):
        df = pd.concat(data[key], ignore_index=True)
        df.columns = [c.upper() for c in df.columns]
        return df

    def get_cols(df, col_list, default_name):
        for col in col_list:
            if col in df.columns:
                return df[col]
        return pd.Series([np.nan] * len(df), name=default_name)

    demo = safe_concat("demographics")
    bmx = safe_concat("body_measures")
    glucose = safe_concat("glucose")
    hba1c = safe_concat("hba1c")
    diabetes_q = safe_concat("diabetes_q")
    mcq = safe_concat("family_history")

    # base data
    df = demo[["SEQN", "RIAGENDR", "RIDAGEYR", "RIDRETH3", "RIDEXPRG", "CYCLE"]].copy()
    df.columns = [
        "participant_id",
        "gender",
        "age",
        "race_ethnicity",
        "is_pregnant",
        "cycle",
    ]
    df["is_pregnant"] = df["is_pregnant"].map({1: 1, 2: 0, 3: 0}).fillna(0)

    # body & Las
    df = df.merge(
        bmx[["SEQN", "BMXBMI", "BMXWAIST"]].rename(
            columns={
                "SEQN": "participant_id",
                "BMXBMI": "bmi",
                "BMXWAIST": "waist_circumference",
            }
        ),
        on="participant_id",
        how="left",
    )

    df = df.merge(
        glucose[["SEQN", "LBXGLU"]].rename(
            columns={"SEQN": "participant_id", "LBXGLU": "glucose_mgdl"}
        ),
        on="participant_id",
        how="left",
    )

    df = df.merge(
        hba1c[["SEQN", "LBXGH"]].rename(
            columns={"SEQN": "participant_id", "LBXGH": "hba1c"}
        ),
        on="participant_id",
        how="left",
    )

    # Family history
    mcq_subset = mcq[["SEQN", "MCQ300C"]].copy()
    mcq_subset.columns = ["participant_id", "family_history"]
    mcq_subset["family_history"] = (
        mcq_subset["family_history"].map({1: 1, 2: 0, 9: 0}).fillna(0)
    )
    df = df.merge(mcq_subset, on="participant_id", how="left")

    dq_final = pd.DataFrame({"participant_id": diabetes_q["SEQN"]})
    dq_final["diabetes_diagnosis"] = get_cols(diabetes_q, ["DIQ010"], "DIQ010")

    dq_final["prediabetes"] = get_cols(diabetes_q, ["DIQ040", "DIQ160"], "prediabetes")

    dq_final["taking_insulin"] = get_cols(diabetes_q, ["DIQ050"], "DIQ050")

    df = df.merge(dq_final, on="participant_id", how="left")

    logger.info(f"Final merged dataset: {len(df)} participants.")
    return df


def diabetes_outcome(df: pd.DataFrame) -> pd.DataFrame:
    """
    0: Healthy
    1: Prediabetes
    2: Diabetes
    """
    logger.info("Generating unified multi-class target...")

    df["target"] = 0

    prediabetes_mask = (
        (df["prediabetes"] == 1)
        | (df["diabetes_diagnosis"] == 3.0)
        | ((df["hba1c"] >= 5.7) & (df["hba1c"] < 6.5))
        | ((df["glucose_mgdl"] >= 100) & (df["glucose_mgdl"] < 126))
    )
    df.loc[prediabetes_mask, "target"] = 1

    diabetes_mask = (
        (df["diabetes_diagnosis"] == 1)
        | (df["hba1c"] >= 6.5)
        | (df["glucose_mgdl"] >= 126)
    )
    df.loc[diabetes_mask, "target"] = 2

    #  the distribution to check for class imbalance log
    counts = df["target"].value_counts().sort_index()
    logger.info(f"Target Distribution:\n{counts}")

    perc = (counts / len(df)) * 100
    logger.info(f"Class Percentages:\n{perc}")

    return df


def clean_and_engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """clean and engineer features"""

    logger.info("\n Cleaning and engineering features")

    race_map = {
        1: "Mexican_American",
        2: "Other_Hispanic",
        3: "Non_Hispanic_White",
        4: "Non_Hispanic_Black",
        6: "Non_Hispanic_Asian",
        7: "Other_Multiracial",
    }

    features = [
        "gender",
        "age",
        "bmi",
        "race_ethnicity",
        "waist_circumference",
        "is_pregnant",
        "family_history",
        "target",
    ]

    df["race_ethnicity"] = df["race_ethnicity"].map(race_map)
    df_model = df[features].copy()

    df_model = df_model[df_model["age"] >= 18].copy()
    logger.info(f"age after filter: {len(df_model)}")

    df_model["gender"] = df_model["gender"].map({1: 0, 2: 1})

    df_model["gender"] = df_model["gender"].astype(int).astype("category")
    df_model["race_ethnicity"] = df_model["race_ethnicity"].astype("category")
    df_model["is_pregnant"] = df_model["is_pregnant"].astype(int).astype("category")
    df_model["target"] = df_model["target"].astype(int).astype("category")
    df_model["family_history"] = (
        df_model["family_history"].astype(int).astype("category")
    )

    logger.info(f"Features: {list(df_model.columns)}")

    return df_model


def save_processed_data(df: pd.DataFrame, output_dir: str = "./data"):
    """Save processed data for modeling."""
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, "cleaned_nhanes_diabetes.csv")
    df.to_csv(output_path, index=False)
    logger.info(f"Saved to {output_path}")

    train_df, test_df = train_test_split(
        df, test_size=0.2, random_state=42, stratify=df["target"]
    )

    features_for_mice = ["bmi", "waist_circumference", "age"]

    mice_data = train_df[features_for_mice].copy()

    imputer = IterativeImputer(max_iter=10, random_state=42)
    imputed = imputer.fit_transform(mice_data)

    train_df["bmi"] = imputed[:, 0]
    train_df["waist_circumference"] = imputed[:, 1]

    mice_data = test_df[features_for_mice].copy()

    imputed = imputer.transform(mice_data)

    test_df["bmi"] = imputed[:, 0]
    test_df["waist_circumference"] = imputed[:, 1]

    train_df.to_csv(os.path.join(output_dir, "processed_train_data.csv"), index=False)
    test_df.to_csv(os.path.join(output_dir, "processed_test_data.csv"), index=False)

    logger.info(f"Train: {len(train_df)}, Test: {len(test_df)}")
    logger.info(f"Columns train: {train_df.columns}")
    logger.info(f"Columns test: {test_df.columns}")

    data_dict = {
        "gender": "0=Male, 1=Female",
        "age": "Years",
        "bmi": "Body Mass Index",
        "waist_circumference": "Waist circumference (cm)",
        "race_ethnicity": "Self-reported race/ethnicity",
        "family_history": "Family history of diabetes",
        "target": "0=Healthy, 1=Prediabetes, 2=Diabetes",
        "is_pregnant": "0=No, 1=Yes",
    }

    with open(os.path.join(output_dir, "nhanes_data_dictionary.json"), "w") as f:
        import json

        json.dump(data_dict, f, indent=2)


def main():

    logger.info("\n Starting data processing")
    raw_data = load_cycles()
    merged_data = merge_data(raw_data)
    outcome_data = diabetes_outcome(merged_data)
    processed_data = clean_and_engineer_features(outcome_data)
    save_processed_data(processed_data)
    logger.info("\n Data processing completed")

    logger.info("\n Dataset Summary: ")
    logger.info(f"total participants: {len(processed_data)}")
    logger.info(f"total columns: {processed_data.columns}")
    logger.info(
        f"Age range: {processed_data['age'].min()} - {processed_data['age'].max()}"
    )
    logger.info(f"gender distribution: {processed_data['gender'].value_counts()}")
    logger.info(
        f"race/ethnicity distribution: {processed_data['race_ethnicity'].value_counts()}"
    )

    return processed_data


if __name__ == "__main__":
    df = main()
