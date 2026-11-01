"""
Admin API Routes
=================
Endpoints for model retraining, CSV export, audit log, and user management.
"""

import io
import csv
import json
import subprocess
import sys
from datetime import datetime
from flask import Blueprint, request, jsonify, Response, g

import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
import config
from api.database import db, Claim, PredictionLog, ModelVersion, User
from api.auth import role_required, hash_password, create_token, verify_password, token_required
from src.utils import load_metrics

admin_bp = Blueprint("admin", __name__)


# ---------------------------------------------------------------------------
# Admin endpoints (auth bypassed, accessible by default)
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Model Retraining (FR7 — admin button)
# ---------------------------------------------------------------------------

@admin_bp.route("/api/admin/retrain", methods=["POST"])
@role_required("admin")
def retrain_model():
    """
    Trigger model retraining (FR7).
    Runs train_pipeline.py as a subprocess.
    """
    try:
        # Run the training pipeline
        result = subprocess.run(
            [sys.executable, "train_pipeline.py", "--no-tune"],
            cwd=os.path.join(os.path.dirname(__file__), "..", ".."),
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
        )

        if result.returncode != 0:
            return jsonify({
                "error": "Retraining failed",
                "stderr": result.stderr,
                "stdout": result.stdout,
            }), 500

        # Load new metrics and create a version record
        try:
            metrics = load_metrics(config.TRAINING_METRICS_PATH)
            version = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            model_version = ModelVersion(
                version=version,
                fraud_accuracy=metrics["fraud_classifier"]["accuracy"],
                fraud_precision=metrics["fraud_classifier"]["precision"],
                fraud_recall=metrics["fraud_classifier"]["recall"],
                fraud_f1=metrics["fraud_classifier"]["f1_score"],
                fraud_auc_roc=metrics["fraud_classifier"]["roc_auc"],
                amount_mae=metrics["amount_regressor"]["mae"],
                amount_rmse=metrics["amount_regressor"]["rmse"],
                amount_r2=metrics["amount_regressor"]["r2_score"],
                is_active=True,
                trained_by=g.current_user.get("username", "unknown"),
            )
            db.session.add(model_version)
            db.session.commit()
        except Exception:
            pass  # Non-critical; metrics logging failure shouldn't fail the retrain

        # Reload models in the running app
        from flask import current_app
        from src.utils import load_model
        current_app.config["FRAUD_MODEL"] = load_model(config.FRAUD_MODEL_PATH)
        current_app.config["AMOUNT_MODEL"] = load_model(config.AMOUNT_MODEL_PATH)
        current_app.config["PREPROCESSOR"] = load_model(config.PREPROCESSOR_PATH)

        return jsonify({
            "message": "Model retrained successfully",
            "output": result.stdout[-1000:] if len(result.stdout) > 1000 else result.stdout,
        })

    except subprocess.TimeoutExpired:
        return jsonify({"error": "Retraining timed out (5 minute limit)"}), 504
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# CSV Export (FR10)
# ---------------------------------------------------------------------------

@admin_bp.route("/api/admin/export", methods=["GET"])
@role_required("admin", "claims_officer")
def export_claims_csv():
    """
    Export claims as CSV (FR10).
    Supports filtering: status=flagged, is_fraud=true, etc.
    """
    status = request.args.get("status")
    is_fraud = request.args.get("is_fraud")

    query = Claim.query

    if status:
        query = query.filter(Claim.status == status)
    if is_fraud is not None:
        query = query.filter(Claim.is_fraud == (is_fraud.lower() == "true"))

    claims = query.order_by(Claim.created_at.desc()).all()

    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    headers = [
        "claim_id", "customer_age", "customer_gender", "customer_region",
        "num_past_claims", "policy_type", "coverage_amount",
        "policy_start_date", "policy_end_date",
        "vehicle_make", "vehicle_model", "vehicle_manufacture_year", "vehicle_age",
        "insured_declared_value", "damage_type", "damage_severity",
        "days_since_policy_start", "claim_amount_requested",
        "claim_to_coverage_ratio", "fraud_probability", "is_fraud",
        "estimated_amount", "risk_score", "risk_level", "status",
        "submitted_by", "reviewed_by", "created_at",
    ]
    writer.writerow(headers)

    for c in claims:
        writer.writerow([
            c.id, c.customer_age, c.customer_gender, c.customer_region,
            c.num_past_claims, c.policy_type, c.coverage_amount,
            c.policy_start_date, c.policy_end_date,
            c.vehicle_make, c.vehicle_model, c.vehicle_manufacture_year, c.vehicle_age,
            c.insured_declared_value, c.damage_type, c.damage_severity,
            c.days_since_policy_start, c.claim_amount_requested,
            c.claim_to_coverage_ratio, c.fraud_probability, c.is_fraud,
            c.estimated_amount, c.risk_score, c.risk_level, c.status,
            c.submitted_by, c.reviewed_by, c.created_at,
        ])

    output.seek(0)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"claims_export_{timestamp}.csv"

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ---------------------------------------------------------------------------
# Audit Log (NFR7)
# ---------------------------------------------------------------------------

@admin_bp.route("/api/admin/audit-log", methods=["GET"])
@role_required("admin")
def get_audit_log():
    """View prediction audit log (NFR7)."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)

    pagination = PredictionLog.query.order_by(
        PredictionLog.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "logs": [log.to_dict() for log in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total_pages": pagination.pages,
    })


# ---------------------------------------------------------------------------
# Model Versions
# ---------------------------------------------------------------------------

@admin_bp.route("/api/admin/model-versions", methods=["GET"])
@role_required("admin")
def get_model_versions():
    """List all model versions."""
    versions = ModelVersion.query.order_by(ModelVersion.trained_at.desc()).all()
    return jsonify({"versions": [v.to_dict() for v in versions]})


# ---------------------------------------------------------------------------
# Users management
# ---------------------------------------------------------------------------

@admin_bp.route("/api/admin/users", methods=["GET"])
@role_required("admin")
def list_users():
    """List all users (admin only)."""
    users = User.query.all()
    return jsonify({"users": [u.to_dict() for u in users]})
