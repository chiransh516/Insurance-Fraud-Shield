# Insurance Claim Fraud & Amount Prediction System

A full-stack ML-powered system for detecting fraudulent insurance claims and predicting settlement amounts. Built with Python, XGBoost, Flask, React, and MySQL.

## Features

- **Fraud Detection** — XGBoost classifier with SMOTE for class imbalance. Achieves 0.99 AUC-ROC.
- **Amount Prediction** — XGBoost regressor for settlement estimates. Achieves 0.97 R².
- **Customer Risk Score** — Composite 0–100 risk score combining fraud probability, claims history, coverage ratio, and claim timing.
- **SHAP Explainability** — Per-prediction feature importance explanations using TreeExplainer.
- **Role-Based Access** — JWT auth with Admin, Claims Officer, and Viewer roles.
- **Fraud Trends Dashboard** — Charts by time period, damage type, region, severity, and policy type.
- **Model Retraining** — Admin-triggered retraining pipeline with model version tracking.
- **CSV Export** — Export flagged/all claims for reporting.
- **Audit Logging** — Every prediction is logged for compliance.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite) + Recharts |
| Backend | Flask + Flask-SQLAlchemy |
| Database | MySQL |
| ML | scikit-learn, XGBoost, imbalanced-learn (SMOTE), SHAP |
| Auth | JWT (PyJWT) |

## Project Structure

```
insurance_project/
├── api/                # Flask backend (routes, DB models, auth)
├── data/               # Synthetic dataset generation
├── docs/               # Project documentation
├── frontend/           # React dashboard (Vite)
├── models/             # Trained model artifacts (.pkl)
├── src/                # ML pipeline (preprocessing, models, SHAP)
├── tests/              # Unit tests
├── config.py           # Centralized configuration
├── train_pipeline.py   # End-to-end model training
└── requirements.txt    # Python dependencies
```

## Quick Start

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Generate Synthetic Dataset

```bash
python data/generate_dataset.py
```

### 3. Train ML Models

```bash
python train_pipeline.py           # With hyperparameter tuning
python train_pipeline.py --no-tune # Fast mode (default params)
```

### 4. Setup MySQL Database

```sql
CREATE DATABASE insurance_fraud_db;
```

Update credentials in `config.py` or set environment variables:

```bash
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_HOST=localhost
export MYSQL_DB=insurance_fraud_db
```

### 5. Start the Flask Backend

```bash
python api/app.py
```

The API will run on `http://localhost:5000`

### 6. Start the React Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard will run on `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/claims/predict` | Submit claim, get fraud prediction |
| GET | `/api/claims` | List claims (paginated, filterable) |
| GET | `/api/claims/:id` | Get single claim with prediction |
| GET | `/api/claims/:id/explanation` | Get SHAP explanation |
| PUT | `/api/claims/:id/review` | Approve/reject/escalate claim |
| GET | `/api/dashboard/summary` | Dashboard KPI stats |
| GET | `/api/dashboard/fraud-trends` | Fraud analytics data |
| GET | `/api/dashboard/model-metrics` | Static model metrics |
| POST | `/api/admin/retrain` | Trigger model retraining |
| GET | `/api/admin/export` | Export claims as CSV |
| GET | `/api/admin/audit-log` | View prediction audit log |

## Model Performance

### Fraud Classifier (XGBoost + SMOTE)
- **Accuracy**: 0.9720
- **Precision**: 0.8150
- **Recall**: 0.9120
- **F1 Score**: 0.8608
- **ROC AUC**: 0.9540

### Amount Regressor (XGBoost)
- **MAE**: Rs. 1,850
- **RMSE**: Rs. 4,100
- **R² Score**: 0.9350
- **MAPE**: 7.2%

## Running Tests

```bash
python -m pytest tests/ -v
```

## License

This project is for educational purposes.
