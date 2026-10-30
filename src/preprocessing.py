"""
Preprocessing & Feature Engineering Pipeline
==============================================
Scikit-learn ColumnTransformer pipeline for encoding categorical features,
scaling numerical features, and deriving new features from raw claim data.
"""

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
from sklearn.impute import SimpleImputer

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


def derive_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create derived features from raw data.
    This runs BEFORE the sklearn pipeline (on the DataFrame level).
    """
    df = df.copy()

    # Vehicle age
    if "vehicle_manufacture_year" in df.columns:
        df["vehicle_age"] = 2026 - df["vehicle_manufacture_year"]

    # Days since policy start
    if "policy_start_date" in df.columns and "claim_date" not in df.columns:
        # If days_since_policy_start is already present, keep it
        pass

    # Claim-to-coverage ratio
    if "claim_amount_requested" in df.columns and "coverage_amount" in df.columns:
        df["claim_to_coverage_ratio"] = (
            df["claim_amount_requested"] / df["coverage_amount"]
        ).round(4)

    # Policy duration in days
    if "policy_start_date" in df.columns and "policy_end_date" in df.columns:
        df["policy_start_date"] = pd.to_datetime(df["policy_start_date"])
        df["policy_end_date"] = pd.to_datetime(df["policy_end_date"])
        df["policy_duration_days"] = (
            df["policy_end_date"] - df["policy_start_date"]
        ).dt.days

    # Is early claim flag (claim filed within 60 days of policy start)
    if "days_since_policy_start" in df.columns:
        df["is_early_claim"] = (df["days_since_policy_start"] < 60).astype(int)

    return df


def get_feature_columns():
    """Return the lists of numerical and categorical feature column names."""
    numerical = config.NUMERICAL_FEATURES + ["is_early_claim"]
    categorical = config.CATEGORICAL_FEATURES
    return numerical, categorical


def build_preprocessor() -> ColumnTransformer:
    """
    Build a ColumnTransformer that:
    - Imputes + scales numerical features
    - Imputes + ordinal-encodes categorical features (suitable for tree-based models)
    """
    numerical_features, categorical_features = get_feature_columns()

    numerical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numerical_pipeline, numerical_features),
            ("cat", categorical_pipeline, categorical_features),
        ],
        remainder="drop",  # Drop columns not listed (IDs, dates, targets)
    )

    return preprocessor


def get_all_feature_names(preprocessor: ColumnTransformer) -> list:
    """Get feature names after transformation for SHAP labeling."""
    numerical_features, categorical_features = get_feature_columns()
    return numerical_features + categorical_features


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Full feature preparation: derive features, then select the columns
    needed by the preprocessor.
    """
    df = derive_features(df)
    numerical_features, categorical_features = get_feature_columns()
    all_features = numerical_features + categorical_features
    missing = [c for c in all_features if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in input data: {missing}")
    return df
