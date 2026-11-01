"""
Claims API Routes
==================
Endpoints for claim submission, prediction, and retrieval.
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime
from flask import Blueprint, request, jsonify, g

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
import config  # noqa: E402
from api.database import db, Claim, PredictionLog, User  # noqa: E402
from api.auth import token_required, role_required  # noqa: E402
from src.preprocessing import derive_features, get_feature_columns, get_all_feature_names  # noqa: E402
from src.risk_scorer import compute_risk_score  # noqa: E402
from src.explainer import create_explainer, explain_prediction  # noqa: E402

claims_bp = Blueprint("claims", __name__)


def _get_models():
    """Get loaded models from Flask app context."""
    from flask import current_app
    return (
        current_app.config.get("FRAUD_MODEL"),
        current_app.config.get("AMOUNT_MODEL"),
        current_app.config.get("PREPROCESSOR"),
    )


def _prepare_claim_input(data: dict) -> pd.DataFrame:
    """Convert request data into a DataFrame suitable for preprocessing."""
    # Parse dates
    policy_start = pd.to_datetime(data["policy_start_date"])
    policy_end = pd.to_datetime(data["policy_end_date"])

    # Calculate derived fields
    days_since_policy_start = data.get(
        "days_since_policy_start",
        (datetime.now() - policy_start).days,
    )

    df = pd.DataFrame([{
        "customer_age": data["customer_age"],
        "customer_gender": data["customer_gender"],
        "customer_region": data["customer_region"],
        "num_past_claims": data.get("num_past_claims", 0),
        "policy_type": data["policy_type"],
        "coverage_amount": data["coverage_amount"],
        "policy_start_date": policy_start,
        "policy_end_date": policy_end,
        "vehicle_make": data["vehicle_make"],
        "vehicle_model": data["vehicle_model"],
        "vehicle_manufacture_year": data["vehicle_manufacture_year"],
        "insured_declared_value": data["insured_declared_value"],
        "damage_type": data["damage_type"],
        "damage_severity": data["damage_severity"],
        "days_since_policy_start": days_since_policy_start,
        "claim_amount_requested": data["claim_amount_requested"],
    }])

    # Derive features
    df = derive_features(df)
    return df


@claims_bp.route("/api/claims/predict", methods=["POST"])
@token_required
def predict_claim():
    """
    Submit a single claim and get fraud prediction + amount estimate.
    
    FR2: Classify claim as Fraud / Not Fraud with probability score
    FR3: Predict estimated claim amount for non-fraud claims
    FR4: Feature-level explanation (SHAP)
    FR8: Risk score (0-100)
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    # Validate required fields
    required_fields = [
        "customer_age", "customer_gender", "customer_region",
        "policy_type", "coverage_amount", "policy_start_date", "policy_end_date",
        "vehicle_make", "vehicle_model", "vehicle_manufacture_year",
        "insured_declared_value", "damage_type", "damage_severity",
        "claim_amount_requested",
    ]
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {missing}"}), 400

    fraud_model, amount_model, preprocessor = _get_models()
    if not fraud_model or not preprocessor:
        return jsonify({"error": "Models not loaded. Please train first."}), 503

    try:
        # Prepare features
        df = _prepare_claim_input(data)
        numerical_features, categorical_features = get_feature_columns()
        all_features = numerical_features + categorical_features
        X = preprocessor.transform(df[all_features])

        # Fraud prediction
        fraud_proba = float(fraud_model.predict_proba(X)[:, 1][0])
        is_fraud = fraud_proba >= config.FRAUD_PROBABILITY_THRESHOLD

        # Amount prediction (only for non-fraud)
        estimated_amount = None
        if not is_fraud and amount_model:
            estimated_amount = float(np.maximum(amount_model.predict(X)[0], 0))
            estimated_amount = round(estimated_amount, -2)  # Round to nearest 100

        # Risk score
        risk_result = compute_risk_score(
            fraud_probability=fraud_proba,
            num_past_claims=data.get("num_past_claims", 0),
            claim_to_coverage_ratio=float(df["claim_to_coverage_ratio"].iloc[0]),
            is_early_claim=int(df["is_early_claim"].iloc[0]),
        )

        # SHAP explanation
        feature_names = get_all_feature_names(preprocessor)
        explainer = create_explainer(fraud_model)
        explanation = explain_prediction(explainer, X[0], feature_names, top_n=5)

        # Store in database
        claim = Claim(
            customer_age=data["customer_age"],
            customer_gender=data["customer_gender"],
            customer_region=data["customer_region"],
            num_past_claims=data.get("num_past_claims", 0),
            policy_type=data["policy_type"],
            coverage_amount=data["coverage_amount"],
            policy_start_date=pd.to_datetime(data["policy_start_date"]).date(),
            policy_end_date=pd.to_datetime(data["policy_end_date"]).date(),
            vehicle_make=data["vehicle_make"],
            vehicle_model=data["vehicle_model"],
            vehicle_manufacture_year=data["vehicle_manufacture_year"],
            vehicle_age=int(df["vehicle_age"].iloc[0]),
            insured_declared_value=data["insured_declared_value"],
            damage_type=data["damage_type"],
            damage_severity=data["damage_severity"],
            days_since_policy_start=int(df["days_since_policy_start"].iloc[0]),
            claim_amount_requested=data["claim_amount_requested"],
            claim_to_coverage_ratio=float(df["claim_to_coverage_ratio"].iloc[0]),
            policy_duration_days=int(df["policy_duration_days"].iloc[0]),
            fraud_probability=fraud_proba,
            is_fraud=is_fraud,
            estimated_amount=estimated_amount,
            risk_score=risk_result["risk_score"],
            risk_level=risk_result["risk_level"],
            shap_explanation=json.dumps(explanation),
            status="flagged" if is_fraud else "processed",
            submitted_by=g.current_user.get("username", "unknown"),
        )
        db.session.add(claim)
        db.session.flush()

        # Audit log
        prediction_log = PredictionLog(
            claim_id=claim.id,
            fraud_probability=fraud_proba,
            is_fraud=is_fraud,
            estimated_amount=estimated_amount,
            risk_score=risk_result["risk_score"],
            model_version="v1.0",
            predicted_by=g.current_user.get("username", "unknown"),
        )
        db.session.add(prediction_log)
        db.session.commit()

        # If the user is a regular customer, hide ML prediction results
        if g.current_user.get("role") == "user":
            return jsonify({
                "claim_id": claim.id,
                "status": "pending",
                "message": "Claim submitted successfully and is pending review."
            }), 201
            
        return jsonify({
            "claim_id": claim.id,
            "fraud_probability": round(fraud_proba, 4),
            "is_fraud": is_fraud,
            "estimated_amount": estimated_amount,
            "risk_score": risk_result["risk_score"],
            "risk_level": risk_result["risk_level"],
            "risk_components": risk_result["components"],
            "shap_explanation": explanation,
            "status": claim.status,
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@claims_bp.route("/api/claims", methods=["GET"])
@token_required
def list_claims():
    """
    List claims with optional filters.
    
    Query params: status, damage_type, region, is_fraud, page, per_page
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")
    damage_type = request.args.get("damage_type")
    region = request.args.get("region")
    is_fraud = request.args.get("is_fraud")

    query = Claim.query

    if status:
        query = query.filter(Claim.status == status)
    if damage_type:
        query = query.filter(Claim.damage_type == damage_type)
    if region:
        query = query.filter(Claim.customer_region == region)
    if is_fraud is not None:
        query = query.filter(Claim.is_fraud == (is_fraud.lower() == "true"))

    # Role-based filtering: regular users only see their own claims
    if g.current_user.get("role") == "user":
        query = query.filter(Claim.submitted_by == g.current_user.get("username"))

    query = query.order_by(Claim.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "claims": [c.to_dict() for c in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total_pages": pagination.pages,
    })


@claims_bp.route("/api/claims/<int:claim_id>", methods=["GET"])
@token_required
def get_claim(claim_id):
    """Get a single claim by ID with prediction results."""
    claim = Claim.query.get(claim_id)
    if not claim:
        return jsonify({"error": "Claim not found"}), 404

    result = claim.to_dict()
    if claim.shap_explanation:
        result["shap_explanation"] = json.loads(claim.shap_explanation)
    
    user = User.query.filter_by(username=claim.submitted_by).first()
    result["customer_name"] = user.full_name if user and user.full_name else claim.submitted_by
        
    return jsonify(result)


@claims_bp.route("/api/claims/<int:claim_id>/explanation", methods=["GET"])
@token_required
def get_claim_explanation(claim_id):
    """Get SHAP explanation for a specific claim (FR4)."""
    claim = Claim.query.get(claim_id)
    if not claim:
        return jsonify({"error": "Claim not found"}), 404

    if not claim.shap_explanation:
        return jsonify({"error": "No explanation available for this claim"}), 404

    return jsonify(json.loads(claim.shap_explanation))


@claims_bp.route("/api/claims/<int:claim_id>/review", methods=["PUT"])
@role_required("admin")
def review_claim(claim_id):
    """
    Update claim status (approve/reject/escalate).
    Only admin and claims_officer roles can review.
    """
    claim = Claim.query.get(claim_id)
    if not claim:
        return jsonify({"error": "Claim not found"}), 404

    data = request.get_json()
    new_status = data.get("status")
    if new_status not in ["approved", "rejected", "escalated", "flagged"]:
        return jsonify({"error": "Invalid status. Must be: approved, rejected, escalated, flagged"}), 400

    claim.status = new_status
    claim.reviewed_by = g.current_user.get("username", "unknown")
    claim.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": f"Claim {claim_id} updated to '{new_status}'", "claim": claim.to_dict()})


@claims_bp.route("/api/claims/<int:claim_id>", methods=["DELETE"])
@token_required
def delete_claim(claim_id):
    """Delete a claim and its associated logs."""
    claim = Claim.query.get(claim_id)
    if not claim:
        return jsonify({"error": "Claim not found"}), 404

    PredictionLog.query.filter_by(claim_id=claim_id).delete()
    db.session.delete(claim)
    db.session.commit()
    return jsonify({"message": "Claim deleted successfully"})
