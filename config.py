"""
Centralized configuration for the Insurance Claim Fraud & Amount Prediction System.
"""
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
DATA_PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODELS_DIR = os.path.join(BASE_DIR, "models")

DATASET_PATH = os.path.join(DATA_RAW_DIR, "insurance_claims.csv")
PROCESSED_DATASET_PATH = os.path.join(DATA_PROCESSED_DIR, "claims_processed.csv")

FRAUD_MODEL_PATH = os.path.join(MODELS_DIR, "fraud_classifier.pkl")
AMOUNT_MODEL_PATH = os.path.join(MODELS_DIR, "amount_regressor.pkl")
PREPROCESSOR_PATH = os.path.join(MODELS_DIR, "preprocessor.pkl")
TRAINING_METRICS_PATH = os.path.join(MODELS_DIR, "training_metrics.json")

# ---------------------------------------------------------------------------
# Database (MySQL)
# ---------------------------------------------------------------------------
MYSQL_USER = os.environ.get("MYSQL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
MYSQL_HOST = os.environ.get("MYSQL_HOST", "localhost")
MYSQL_PORT = os.environ.get("MYSQL_PORT", "3306")
MYSQL_DB = os.environ.get("MYSQL_DB", "insurance_fraud_db")

import urllib.parse
encoded_password = urllib.parse.quote_plus(MYSQL_PASSWORD)

SQLALCHEMY_DATABASE_URI = (
    f"mysql+pymysql://{MYSQL_USER}:{encoded_password}"
    f"@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
)

# ---------------------------------------------------------------------------
# JWT / Auth
# ---------------------------------------------------------------------------
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Roles
ROLE_ADMIN = "admin"
ROLE_USER = "user"

# ---------------------------------------------------------------------------
# Model Parameters
# ---------------------------------------------------------------------------
FRAUD_PROBABILITY_THRESHOLD = 0.5  # Tunable; claims above this → flagged
RANDOM_STATE = 42
TEST_SIZE = 0.2

# ---------------------------------------------------------------------------
# Feature Definitions
# ---------------------------------------------------------------------------
CATEGORICAL_FEATURES = [
    "customer_gender",
    "customer_region",
    "policy_type",
    "vehicle_make",
    "damage_type",
    "damage_severity",
]

NUMERICAL_FEATURES = [
    "customer_age",
    "num_past_claims",
    "vehicle_age",
    "insured_declared_value",
    "claim_amount_requested",
    "coverage_amount",
    "days_since_policy_start",
    "claim_to_coverage_ratio",
    "policy_duration_days",
]

DERIVED_FEATURES = [
    "vehicle_age",
    "days_since_policy_start",
    "claim_to_coverage_ratio",
    "policy_duration_days",
    "is_early_claim",
]

TARGET_FRAUD = "is_fraud"
TARGET_AMOUNT = "settled_amount"

# ---------------------------------------------------------------------------
# Risk Score Weights
# ---------------------------------------------------------------------------
RISK_WEIGHTS = {
    "fraud_probability": 0.60,
    "num_past_claims": 0.15,
    "claim_to_coverage_ratio": 0.15,
    "is_early_claim": 0.10,
}

# ---------------------------------------------------------------------------
# Dataset Generation
# ---------------------------------------------------------------------------
NUM_SAMPLES = 10_000
FRAUD_RATE = 0.07  # ~7% fraud

# Vehicle makes and models (Indian market)
VEHICLE_CATALOG = {
    "Maruti Suzuki": ["Swift", "Baleno", "Alto", "WagonR", "Dzire", "Brezza"],
    "Hyundai": ["i20", "Creta", "Venue", "Verna", "i10"],
    "Tata": ["Nexon", "Punch", "Harrier", "Altroz", "Tiago"],
    "Mahindra": ["Scorpio", "XUV700", "Thar", "Bolero", "XUV300"],
    "Kia": ["Seltos", "Sonet", "Carens"],
    "Toyota": ["Fortuner", "Innova", "Glanza", "Urban Cruiser"],
    "Honda": ["City", "Amaze", "Elevate"],
    "MG": ["Hector", "Astor", "Gloster"],
    "Skoda": ["Slavia", "Kushaq", "Superb"],
    "Volkswagen": ["Virtus", "Taigun", "Polo"],
}

DAMAGE_TYPES = [
    "Bumper Damage",
    "Windshield Damage",
    "Engine Damage",
    "Airbag Deployment",
    "Total Loss",
    "Scratch-Dent",
    "Electrical Damage",
]

DAMAGE_SEVERITIES = ["Minor", "Moderate", "Severe"]

POLICY_TYPES = ["Comprehensive", "Third-Party", "Own-Damage"]

REGIONS = ["North", "South", "East", "West", "Central"]
