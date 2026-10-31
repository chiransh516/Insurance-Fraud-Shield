"""
Tests for the risk scorer module.
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from src.risk_scorer import compute_risk_score, compute_risk_scores_batch


def test_low_risk_score():
    """Test that low-risk inputs produce a Low risk score."""
    result = compute_risk_score(
        fraud_probability=0.1,
        num_past_claims=0,
        claim_to_coverage_ratio=0.05,
        is_early_claim=0,
    )
    assert result["risk_level"] == "Low"
    assert result["risk_score"] <= 30


def test_high_risk_score():
    """Test that high-risk inputs produce a High risk score."""
    result = compute_risk_score(
        fraud_probability=0.9,
        num_past_claims=8,
        claim_to_coverage_ratio=0.95,
        is_early_claim=1,
    )
    assert result["risk_level"] == "High"
    assert result["risk_score"] > 60


def test_medium_risk_score():
    """Test medium-risk boundary."""
    result = compute_risk_score(
        fraud_probability=0.45,
        num_past_claims=3,
        claim_to_coverage_ratio=0.3,
        is_early_claim=0,
    )
    assert result["risk_level"] in ["Low", "Medium"]
    assert 0 <= result["risk_score"] <= 100


def test_risk_score_bounds():
    """Test that risk score is always between 0 and 100."""
    # Extreme high values
    result = compute_risk_score(1.5, 100, 5.0, 1)
    assert 0 <= result["risk_score"] <= 100

    # Extreme low values
    result = compute_risk_score(-0.5, -1, -0.5, 0)
    assert 0 <= result["risk_score"] <= 100


def test_risk_components_present():
    """Test that components dict is populated."""
    result = compute_risk_score(0.5, 2, 0.4, 1)
    assert "components" in result
    assert "fraud_probability_score" in result["components"]
    assert "claims_history_score" in result["components"]


def test_batch_scoring():
    """Test batch risk scoring."""
    import numpy as np
    results = compute_risk_scores_batch(
        fraud_probabilities=np.array([0.1, 0.5, 0.9]),
        num_past_claims=np.array([0, 3, 8]),
        claim_to_coverage_ratios=np.array([0.05, 0.4, 0.95]),
        is_early_claims=np.array([0, 0, 1]),
    )
    assert len(results) == 3
    assert results[0]["risk_score"] < results[2]["risk_score"]
