"""
Tests for the preprocessing pipeline.
"""

import sys
import os
import pytest
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config
from src.preprocessing import derive_features, build_preprocessor, get_feature_columns


@pytest.fixture
def sample_data():
    """Create a small sample DataFrame for testing."""
    return pd.DataFrame({
        "customer_age": [30, 45, 25],
        "customer_gender": ["Male", "Female", "Male"],
        "customer_region": ["North", "South", "East"],
        "num_past_claims": [1, 3, 0],
        "policy_type": ["Comprehensive", "Third-Party", "Own-Damage"],
        "coverage_amount": [500000, 300000, 400000],
        "policy_start_date": pd.to_datetime(["2025-01-01", "2024-06-15", "2025-03-20"]),
        "policy_end_date": pd.to_datetime(["2026-01-01", "2025-06-15", "2026-03-20"]),
        "vehicle_make": ["Maruti Suzuki", "Hyundai", "Tata"],
        "vehicle_model": ["Swift", "Creta", "Nexon"],
        "vehicle_manufacture_year": [2020, 2018, 2022],
        "insured_declared_value": [400000, 300000, 500000],
        "damage_type": ["Bumper Damage", "Engine Damage", "Total Loss"],
        "damage_severity": ["Minor", "Severe", "Moderate"],
        "days_since_policy_start": [100, 30, 200],
        "claim_amount_requested": [15000, 80000, 250000],
    })


def test_derive_features(sample_data):
    """Test that derived features are computed correctly."""
    result = derive_features(sample_data)

    assert "vehicle_age" in result.columns
    assert "claim_to_coverage_ratio" in result.columns
    assert "policy_duration_days" in result.columns
    assert "is_early_claim" in result.columns

    # Vehicle age should be 2026 - manufacture_year
    assert result["vehicle_age"].iloc[0] == 6
    assert result["vehicle_age"].iloc[2] == 4

    # Claim-to-coverage ratio
    expected_ratio = 15000 / 500000
    assert abs(result["claim_to_coverage_ratio"].iloc[0] - expected_ratio) < 0.001

    # Early claim flag (within 60 days)
    assert result["is_early_claim"].iloc[0] == 0  # 100 days
    assert result["is_early_claim"].iloc[1] == 1  # 30 days


def test_build_preprocessor(sample_data):
    """Test that the preprocessor builds and transforms correctly."""
    data = derive_features(sample_data)
    preprocessor = build_preprocessor()

    numerical_features, categorical_features = get_feature_columns()
    all_features = numerical_features + categorical_features
    X = preprocessor.fit_transform(data[all_features])

    assert X.shape[0] == 3  # 3 samples
    assert X.shape[1] == len(numerical_features) + len(categorical_features)
    assert not np.isnan(X).any()


def test_get_feature_columns():
    """Test that feature column lists are valid."""
    numerical, categorical = get_feature_columns()
    assert len(numerical) > 0
    assert len(categorical) > 0
    assert "customer_age" in numerical
    assert "damage_type" in categorical
