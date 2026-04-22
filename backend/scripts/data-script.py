# this file is legacy, not in use

import os
from dotenv import load_dotenv
from kaggle.api.kaggle_api_extended import KaggleApi

load_dotenv()


os.environ["KAGGLE_USERNAME"] = os.getenv("KAGGLE_USERNAME")
os.environ["KAGGLE_KEY"] = os.getenv("KAGGLE_KEY")


print("Username:", os.getenv("KAGGLE_USERNAME"))
print("Key exists:", bool(os.getenv("KAGGLE_KEY")))

api = KaggleApi()
api.authenticate()


print("========= downloading dataset =========")
api.dataset_download_files(
    "uciml/pima-indians-diabetes-database", path="../scripts/data", unzip=True
)
