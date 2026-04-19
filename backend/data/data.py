import os
import pandas as pd
import numpy as np
import requests
import zipfile
from io import BytesIO
from typing import List, Dict, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

#I decided to use the pre-covid data. On National Health and Nutrition Examination Survey
#website, there were changes in data collection in post-covid.
#In particular, no oversampling by race, income & hispanic origin leading to larger standard errors
#and wider confidence intervals for groups with fewer participants. There are other changes too

cycles = [
    ("2013-2014", "H"),
    ("2015-2016", "I"),
    ("2017-2020", "P")
]

base_url = "https://wwwn.cdc.gov/Nchs/Nhanes/"

FILES = {
    "demographics": "DEMO",
    "examination": "BMX",      # Body measures (BMI)
    "laboratory": {
        "glucose": "GLU",      # Fasting glucose
        "hba1c": "GHB",        # Glycohemoglobin
        "insulin": "INS"
    },
    "questionnaire": {
        "diabetes": "DIQ",     # Diabetes questionnaire (outcome)
        "medical": "MCQ",       # Medical conditions
        "reproductive": "RHQ"
    }
}

def download_files(cycle_year: str, cycle_code: str, file_code: str, file_type: str = "XPT") -> pd.DataFrame:
    """Download and parse NHANES data files"""
    
    url = f"{base_url}{cycle_year}/{file_code}_{cycle_code}.{file_type}"
    try:
        logger.info(f"downloading {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_Status()

        from io import BytesIO
        df = pd.read_sas(ByteIO(response.content), format='xport')
        df['cycle'] = cycle_year

        logger.info(f"loaded {len(df)} rows from {file_code}_{cycle_code}")
        return df
    except Exception as e:
        logger.error(f"Failed to download {url}: {e}")
        return pd.DataFrame()


def load_cycles() -> Dict[str, List[pd.DataFrame]]:
    """download all the files across all cycles"""
    data = {
        "demographics": [],
        "body_measures": [],
        "glucose": [],
        "hba1c": [],
        "diabetes_q": []
    }

    for year, code in cycles:
        logger.info(f"\n processing cycle {year}")

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

        diabetes_q = download_files(year, code, FILES["questionnaire"]["diabetes"])
        if not diabetes_q.empty:
            data["diabetes_q"].append(diabetes_q)

        rhq = download_files(year, code, FILES["questionnaire"]["reproductive"])
        if not rhq.empty:
            rhq_subset = rhq[['SEQN', 'RHQ141']].copy()
            rhq_subset.columns = ['participant_id', 'pregnancy']
            data["pregnancy"].append(rhq_subset)

    return data


def merge_data(data: Dict[str, List[pd.DataFrame]]) -> pd.DataFrame:
    """merge all the data into a single dataframe"""
    logger.info("\n merging data")

    demo = pd.concat(data["demographics"], ignore_index=True)
    bmx = pd.concat(data["body_measures"], ignore_index=True)
    glucose = pd.concat(data["glucose"], ignore_index=True)
    hba1c = pd.concat(data["hba1c"], ignore_index=True)
    diabetes_q = pd.concat(data["diabetes_q"], ignore_index=True)

    logger.info(f"demographics {len(demo)}, body: {len(bmx)}, glucose: {len(glucose)}, hba1c: {len(hba1c)}, diabetes: {len(diabetes_q)}")

    df = demo[['SEQN', 'RIAGENDR', 'RIDAGEYR', 'RIDRETH3', 'cycle']].copy()
    df.columns = ['participant_id', 'gender', 'age', 'race_ethnicity', 'cycle']

    bmx_subset = bmx[['SEQN', 'BMXBMI', 'BMXWAIST']].copy()
    bmx_subset.columns = ['participant_id', 'bmi', 'waist_circumference']
    df = df.merge(bmx_subset, on='participant_id', how='left')
    
    # Merge glucose (fasting)
    glucose_subset = glucose[['SEQN', 'LBXGLU', 'LBDGLUSI']].copy()
    glucose_subset.columns = ['participant_id', 'glucose_mgdl', 'glucose_mmol']
    df = df.merge(glucose_subset, on='participant_id', how='left')
    
    # Merge HbA1c
    hba1c_subset = hba1c[['SEQN', 'LBXGH']].copy()
    hba1c_subset.columns = ['participant_id', 'hba1c']
    df = df.merge(hba1c_subset, on='participant_id', how='left')
    
    # Merge diabetes outcome
    diabetes_q_subset = diabetes_q[['SEQN', 'DIQ010', 'DIQ040', 'DIQ050']].copy()
    diabetes_q_subset.columns = ['participant_id', 'diabetes_diagnosis', 'prediabetes', 'taking_insulin']
    df = df.merge(diabetes_q_subset, on='participant_id', how='left')
    
    logger.info(f"Final merged dataset: {len(df)} participants")
    return df

def diabetes_outcome(df: pd.DataFrame) -> pd.DataFrame:
    """create diabetes outcome variable"""
   
   df['diabetes'] = 0

   df.loc[df['diabetes_diagnosis'] == 1, 'diabetes']
   df.loc[df['hba1c'] >= 6.5, 'diabetes'] = 1
   df.loc[df['glucose_mgdl'] >= 126, 'diabetes'] = 1
   
   df['prediabetes'] = 0
   df.loc[df['prediabetes'] == 1, 'prediabetes'] = 1
   df.loc[df['hba1c'] >= 5.7 & df['hba1c'] < 6.5, 'prediabetes'] = 1
   df.loc[df['glucose_mgdl'] >= 100 & df['glucose_mgdl'] < 126, 'prediabetes'] = 1
   
   logger.info(f"Diabetes outcome distribution:\n{df['diabetes'].value_counts()}")
   logger.info(f"Prediabetes flag distribution:\n{df['prediabetes'].value_counts()}")

   return df

def clean_and_engineer_features(df:pd.DataFrame) -> pd.DataFrame:
    """clean and engineer features"""
    
    logger.info("\n Cleaning and engineering features")

    df = df[df["age"] > = 18].copy()
    logger.info(f"age after filter: {len(df)}")

    df['gender'] = df['gender'].map({1: 0, 2: 1}) 
    
    race_map = {
        1: 'Mexican_American',
        2: 'Other_Hispanic', 
        3: 'Non_Hispanic_White',
        4: 'Non_Hispanic_Black',
        6: 'Non_Hispanic_Asian',
        7: 'Other_Multiracial'
    }

    df['race_ethnicity'] = df['race_ethnicity'].map(race_map)

    features = [
        'participant_id', 'gender', 'age', 'bmi', 'waist_circumference',
        'glucose_mgdl', 'hba1c', 'diabetes', 'pregnancy', 'family_diabetes_history'
        'race_ethnicity', 'cycle', 'insulin'
    ]

    missing_before = df_model.isnull().sum()
    logger.info(f"Missing values before cleaning:\n{missing_before}")
    
    critical_features = ['glucose_mgdl', 'bmi', 'age', 'gender']
    df_model = df_model.dropna(subset=critical_features)
    
    df_model['hba1c'] = df_model['hba1c'].fillna(df_model['hba1c'].median())
    df_model['waist_circumference'] = df_model['waist_circumference'].fillna(
        df_model['waist_circumference'].median()
    )
    
    logger.info(f"Final clean dataset: {len(df_model)} participants")
    logger.info(f"Features: {list(df_model.columns)}")
    
    return df_model


def save_processed_data(df: pd.DataFrame, output_dir: str = './data'):
    """
    Save processed data for modeling.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, 'nhanes_diabetes.csv')
    df.to_csv(output_path, index=False)
    logger.info(f"Saved to {output_path}")
    
    from sklearn.model_selection import train_test_split
    
    train_df, test_df = train_test_split(
        df, test_size=0.2, random_state=42, stratify=df['diabetes']
    )
    
    train_df.to_csv(os.path.join(output_dir, 'train_data.csv'), index=False)
    test_df.to_csv(os.path.join(output_dir, 'test_data.csv'), index=False)
    
    logger.info(f"Train: {len(train_df)}, Test: {len(test_df)}")
    
    data_dict = {
        'participant_id': 'Unique identifier',
        'gender': '0=Male, 1=Female',
        'age': 'Years',
        'bmi': 'Body Mass Index',
        'waist_circumference': 'Waist circumference (cm)',
        'glucose_mgdl': 'Fasting plasma glucose (mg/dL)',
        'hba1c': 'Glycohemoglobin (%)',
        'diabetes': '0=No, 1=Yes (diagnosed or clinical threshold)',
        'prediabetes': '0=No, 1=Yes',
        'race_ethnicity': 'Self-reported race/ethnicity',
        'cycle': 'NHANES data collection cycle'
    }
    
    with open(os.path.join(output_dir, 'nhanes_data_dictionary.json'), 'w') as f:
        import json
        json.dump(data_dict, f, indent=2)

def process_save_data(df: pd.DataFrame) -> pd.DataFrame:
    """process and save data"""
    race_map = {
        1: 'Mexican_American',
        2: 'Other_Hispanic', 
        3: 'Non_Hispanic_White',
        4: 'Non_Hispanic_Black',
        6: 'Non_Hispanic_Asian',
        7: 'Other_Multiracial'
    }

merged_data_drop_g_h['race_ethnicity'] = merged_data_drop_g_h['race_ethnicity'].map(race_map)
    return processed_data

def main():

    logger.info("\n Starting data processing")
    raw_data = load_cycles()
    merged_data = merge_data(raw_data)
    processed_data = clean_and_engineer_features(merged_data)
    save_processed_data(processed_data)
    logger.info("\n Data processing completed")

    logger.info(f"\n Dataset Summary: ")
    logger.info(f"total participants: {len(processed_data)}")
    logger.info(f"diabetes cases: {processed_data['diabetes'].sum()}")
    logger.info(f"prediabetes cases: {processed_data['prediabetes'].sum()}")
    logger.info(f"diabetes rate: {processed_data['diabetes'].mean():.2%}")
    logger.info(f"prediabetes rate: {processed_data['prediabetes'].mean():.2%}")
    logger.info(f"Age range: {processed_data['age'].min()} - {processed_data['age'].max()}")
    logger.info(f"gender distribution: {processed_data['gender'].value_counts()}")
    logger.info(f"race/ethnicity distribution: {processed_data['race_ethnicity'].value_counts()}")

    return processed_data

if __name__ == "__main__":
    df = main()