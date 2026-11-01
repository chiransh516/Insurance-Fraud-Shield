"""
Dashboard API Routes
=====================
Endpoints for fraud trends, summary stats, and model performance metrics.
"""

import json
from flask import Blueprint, request, jsonify
from sqlalchemy import func, extract

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
import config
from api.database import db, Claim, ModelVersion
from api.auth import token_required
from src.utils import load_metrics

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard/summary", methods=["GET"])
@token_required
def get_summary():
    """
    Overview KPI stats: total claims, fraud rate, avg amount, etc.
    """
    total_claims = db.session.query(func.count(Claim.id)).scalar() or 0
    fraud_count = db.session.query(func.count(Claim.id)).filter(Claim.is_fraud == True).scalar() or 0
    genuine_count = total_claims - fraud_count
    fraud_rate = (fraud_count / total_claims * 100) if total_claims > 0 else 0

    avg_claim_amount = db.session.query(func.avg(Claim.claim_amount_requested)).scalar() or 0
    avg_estimated_amount = db.session.query(
        func.avg(Claim.estimated_amount)
    ).filter(Claim.estimated_amount.isnot(None)).scalar() or 0

    pending_count = db.session.query(func.count(Claim.id)).filter(Claim.status == "pending").scalar() or 0
    flagged_count = db.session.query(func.count(Claim.id)).filter(Claim.status == "flagged").scalar() or 0
    processed_count = db.session.query(func.count(Claim.id)).filter(Claim.status == "processed").scalar() or 0
    approved_count = db.session.query(func.count(Claim.id)).filter(Claim.status == "approved").scalar() or 0
    rejected_count = db.session.query(func.count(Claim.id)).filter(Claim.status == "rejected").scalar() or 0

    avg_risk_score = db.session.query(func.avg(Claim.risk_score)).scalar() or 0

    total_requested = db.session.query(func.sum(Claim.claim_amount_requested)).scalar() or 0
    total_estimated = db.session.query(
        func.sum(Claim.estimated_amount)
    ).filter(Claim.estimated_amount.isnot(None)).scalar() or 0

    return jsonify({
        "total_claims": total_claims,
        "fraud_count": fraud_count,
        "genuine_count": genuine_count,
        "fraud_rate": round(fraud_rate, 2),
        "avg_claim_amount": round(float(avg_claim_amount), 2),
        "avg_estimated_amount": round(float(avg_estimated_amount), 2),
        "avg_risk_score": round(float(avg_risk_score), 1),
        "total_requested_amount": round(float(total_requested), 2),
        "total_estimated_amount": round(float(total_estimated), 2),
        "status_breakdown": {
            "pending": pending_count,
            "flagged": flagged_count,
            "processed": processed_count,
            "approved": approved_count,
            "rejected": rejected_count,
        },
    })


@dashboard_bp.route("/api/dashboard/fraud-trends", methods=["GET"])
@token_required
def get_fraud_trends():
    """
    Detailed fraud trend data (FR9):
    - Fraud counts by month (time-series)
    - Fraud by damage type
    - Fraud by region
    - Fraud by severity
    - Fraud by policy type
    """
    # --- By Month ---
    monthly_data = db.session.query(
        extract("year", Claim.created_at).label("year"),
        extract("month", Claim.created_at).label("month"),
        func.count(Claim.id).label("total"),
        func.sum(func.cast(Claim.is_fraud, db.Integer)).label("fraud_count"),
    ).group_by("year", "month").order_by("year", "month").all()

    by_month = [
        {
            "year": int(row.year),
            "month": int(row.month),
            "total": row.total,
            "fraud_count": int(row.fraud_count or 0),
            "fraud_rate": round(int(row.fraud_count or 0) / row.total * 100, 2) if row.total > 0 else 0,
        }
        for row in monthly_data
    ]

    # --- By Damage Type ---
    damage_data = db.session.query(
        Claim.damage_type,
        func.count(Claim.id).label("total"),
        func.sum(func.cast(Claim.is_fraud, db.Integer)).label("fraud_count"),
    ).group_by(Claim.damage_type).all()

    by_damage_type = [
        {
            "damage_type": row.damage_type,
            "total": row.total,
            "fraud_count": int(row.fraud_count or 0),
            "fraud_rate": round(int(row.fraud_count or 0) / row.total * 100, 2) if row.total > 0 else 0,
        }
        for row in damage_data
    ]

    # --- By Region ---
    region_data = db.session.query(
        Claim.customer_region,
        func.count(Claim.id).label("total"),
        func.sum(func.cast(Claim.is_fraud, db.Integer)).label("fraud_count"),
    ).group_by(Claim.customer_region).all()

    by_region = [
        {
            "region": row.customer_region,
            "total": row.total,
            "fraud_count": int(row.fraud_count or 0),
            "fraud_rate": round(int(row.fraud_count or 0) / row.total * 100, 2) if row.total > 0 else 0,
        }
        for row in region_data
    ]

    # --- By Severity ---
    severity_data = db.session.query(
        Claim.damage_severity,
        func.count(Claim.id).label("total"),
        func.sum(func.cast(Claim.is_fraud, db.Integer)).label("fraud_count"),
    ).group_by(Claim.damage_severity).all()

    by_severity = [
        {
            "severity": row.damage_severity,
            "total": row.total,
            "fraud_count": int(row.fraud_count or 0),
            "fraud_rate": round(int(row.fraud_count or 0) / row.total * 100, 2) if row.total > 0 else 0,
        }
        for row in severity_data
    ]

    # --- By Policy Type ---
    policy_data = db.session.query(
        Claim.policy_type,
        func.count(Claim.id).label("total"),
        func.sum(func.cast(Claim.is_fraud, db.Integer)).label("fraud_count"),
    ).group_by(Claim.policy_type).all()

    by_policy_type = [
        {
            "policy_type": row.policy_type,
            "total": row.total,
            "fraud_count": int(row.fraud_count or 0),
            "fraud_rate": round(int(row.fraud_count or 0) / row.total * 100, 2) if row.total > 0 else 0,
        }
        for row in policy_data
    ]

    return jsonify({
        "by_month": by_month,
        "by_damage_type": by_damage_type,
        "by_region": by_region,
        "by_severity": by_severity,
        "by_policy_type": by_policy_type,
    })


@dashboard_bp.route("/api/dashboard/model-metrics", methods=["GET"])
@token_required
def get_model_metrics():
    """
    Return static model performance metrics from training (FR6).
    Reads from training_metrics.json.
    """
    try:
        metrics = load_metrics(config.TRAINING_METRICS_PATH)
        return jsonify(metrics)
    except FileNotFoundError:
        return jsonify({"error": "No training metrics found. Please train the model first."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dashboard_bp.route("/api/dashboard/risk-distribution", methods=["GET"])
@token_required
def get_risk_distribution():
    """Get distribution of risk scores across all claims."""
    low = db.session.query(func.count(Claim.id)).filter(Claim.risk_level == "Low").scalar() or 0
    medium = db.session.query(func.count(Claim.id)).filter(Claim.risk_level == "Medium").scalar() or 0
    high = db.session.query(func.count(Claim.id)).filter(Claim.risk_level == "High").scalar() or 0

    return jsonify({
        "distribution": {
            "Low": low,
            "Medium": medium,
            "High": high,
        },
        "total": low + medium + high,
    })
