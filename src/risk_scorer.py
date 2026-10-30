"""
Customer Risk Scorer
=====================
Generates a composite risk score (0–100) for each claim/customer
by combining multiple risk signals.
"""

import numpy as np

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


def compute_risk_score(
    fraud_probability: float,
    num_past_claims: int,
    claim_to_coverage_ratio: float,
    is_early_claim: int,
) -> dict:
    """
    Compute a composite risk score (0–100) for a single claim.

    Components (weights from config.RISK_WEIGHTS):
    - Fraud probability (60%): direct from classifier output
    - Past claims history (15%): normalized, capped at 10
    - Claim-to-coverage ratio (15%): capped at 1.0
    - Early claim flag (10%): binary

    Parameters
    ----------
    fraud_probability : float
        Probability from fraud classifier (0–1).
    num_past_claims : int
        Number of past claims by this customer.
    claim_to_coverage_ratio : float
        claim_amount_requested / coverage_amount.
    is_early_claim : int
        1 if claim filed within 60 days of policy start, else 0.

    Returns
    -------
    dict
        {
            "risk_score": int (0–100),
            "risk_level": str ("Low" | "Medium" | "High"),
            "components": dict of individual component scores
        }
    """
    weights = config.RISK_WEIGHTS

    # Normalize each component to 0–1
    fraud_component = np.clip(fraud_probability, 0, 1)
    claims_component = np.clip(num_past_claims / 10.0, 0, 1)
    ratio_component = np.clip(claim_to_coverage_ratio, 0, 1)
    early_component = float(is_early_claim)

    # Weighted sum
    raw_score = (
        weights["fraud_probability"] * fraud_component
        + weights["num_past_claims"] * claims_component
        + weights["claim_to_coverage_ratio"] * ratio_component
        + weights["is_early_claim"] * early_component
    )

    # Scale to 0–100
    risk_score = int(round(raw_score * 100))
    risk_score = max(0, min(100, risk_score))

    # Classify into buckets
    if risk_score <= 30:
        risk_level = "Low"
    elif risk_score <= 60:
        risk_level = "Medium"
    else:
        risk_level = "High"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "components": {
            "fraud_probability_score": round(fraud_component * 100, 1),
            "claims_history_score": round(claims_component * 100, 1),
            "coverage_ratio_score": round(ratio_component * 100, 1),
            "early_claim_score": round(early_component * 100, 1),
        },
    }


def compute_risk_scores_batch(
    fraud_probabilities: np.ndarray,
    num_past_claims: np.ndarray,
    claim_to_coverage_ratios: np.ndarray,
    is_early_claims: np.ndarray,
) -> list:
    """
    Compute risk scores for a batch of claims.

    Returns
    -------
    list[dict]
        List of risk score results.
    """
    results = []
    for fp, npc, ctc, iec in zip(
        fraud_probabilities, num_past_claims, claim_to_coverage_ratios, is_early_claims
    ):
        results.append(compute_risk_score(fp, npc, ctc, iec))
    return results
