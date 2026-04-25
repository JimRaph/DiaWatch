# DiaWatch

An AI-powered diabetes risk assessment platform that analyzes clinical and lifestyle factors to predict diabetes risk levels, track health habits, and provide personalized, actionable recommendations. Built on NHANES epidemiological data with production-grade MLOps infrastructure.

**Live App:** [DiaWatch](https://diawatch.vercel.app)

---

## Project Overview

DiaWatch is a full-stack application with three integrated layers:

- **Frontend (Next.js):** Collects clinical metrics (demographics, vitals) and lifestyle habits through a multi-step form. Features animated UI, dark mode, result visualization, and offline-capable checkup history via IndexedDB.
- **Backend (FastAPI):** Serves a production-trained CatBoost classifier with custom clinical thresholds. Handles prediction requests, user authentication, feedback loops, and health data persistence.
- **ML Pipeline:** End-to-end training pipeline using NHANES survey data, with experiment tracking via MLflow, data drift monitoring via Evidently, and model explainability via SHAP.

*Note: You will see files and scripts that looks like it wasn't used, these files were from previous versions of the app and you can ignore them.*

---

## Dataset

**Primary Dataset:** [NHANES](https://www.cdc.gov/nchs/nhanes/) (National Health and Nutrition Examination Survey)  
Cycles: 2013–2014, 2015–2016, 2017–2020 (pre-COVID)

**Features used:**
- **Clinical:** Age, BMI, waist circumference, gender, race/ethnicity, pregnancy status
- **Lifestyle:** Eating habits, exercise frequency, stress level, family history
- **Target:** Multi-class classification (0 = Healthy, 1 = Prediabetes, 2 = Diabetes)

*Previous versions used the PIMA Indians Diabetes Database. The current model is trained on NHANES for broader demographic representation and clinically validated thresholds.*

---

## Model

- **Algorithm:** CatBoost (Gradient Boosting on Decision Trees)
- **Task:** Multi-class classification (3 classes)
- **Imputation:** `IterativeImputer` (MICE) for continuous clinical features; mode imputation for categoricals
- **Thresholds:** Custom clinical decision boundaries (Prediabetes ≥ 0.40, Diabetes ≥ 0.34) optimized for recall
- **Class Balancing:** `compute_class_weight` with balanced strategy
- **Explainability:** SHAP values for feature attribution
- **Monitoring:** Evidently AI for data drift and model performance tracking

---

## MLOps & Experiment Tracking

| Tool | Purpose |
|------|---------|
| **MLflow** | Experiment tracking, model registry, artifact logging |
| **DagsHub** | Remote MLflow tracking URI + model versioning |
| **Evidently** | Data drift detection and validation |
| **SHAP** | Model explainability and clinical feature importance |

The training pipeline (`scripts/train.py`) automatically logs:
- Hyperparameters, metrics (macro recall, macro F1, per-class recall)
- Confusion matrices and reference datasets
- Custom `DiaWatchModel` wrapper with imputation + thresholding
- Registered model versions with `production` alias
- Used Ray tuner to select best model with custom threshold cross-val-score
---

## Tech Stack

### Backend
- **FastAPI** — Async API framework
- **CatBoost** — Gradient boosting classifier
- **scikit-learn** — Preprocessing, imputation, metrics
- **MLflow** — Experiment tracking & model registry
- **PostgreSQL** — User data and checkup history
- **SQLAlchemy** — ORM
- **PyJWT + passlib** — Authentication
- **Google GenAI** — Personalized recommendation generation

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS** — Styling with dark mode support
- **Framer Motion** — Animations
- **IndexedDB** — Offline checkup history storage

### DevOps & Tooling
- **Docker + Docker Compose** — Containerization (dev/prod split)
- **Ruff** — Python linting & formatting
- **pre-commit** — Git hooks for code quality
- **Fly.io** — Production deployment

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker

### 1. Clone the repository
```bash
git clone https://github.com/JimRaph/DiaWatch.git
cd DiaWatch

### Backend Setup

cd backend

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt

# .env
MLFLOW_TRACKING_URI=https://dagshub.com/<user>/<repo>.mlflow
DAGSHUB_USER=your_username
DAGSHUB_TOKEN=your_access_token
DATABASE_URL=postgresql://user:pass@localhost/diawatch
JWT_SECRET=your_jwt_secret

### Frontend setup
cd ../client
npm install
npm run dev

### Docker dev - I used docker-compose to setup the different services
docker-compose -f docker-compose.dev.yml up --build

### Docker prod
docker compose up --build

### Train model
cd backend
python scripts/train.py
```

### Deployment
- Frontend on vercel
- Backend on Hugginface space (Docker sdk)

### Changes from previous version:
- Changed from Pima to Nhanes dataset
- Added Personalized recommendations using Google GenAI
- Added Feedback API for users
- Added MLflow tracking and model registry
- Added DagsHub for remote MLflow tracking
- Added Evidently AI for data drift detection and model performance
- Added Ray tuner for hyperparameter tuning


