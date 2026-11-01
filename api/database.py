"""
Database Setup — SQLAlchemy + MySQL
====================================
Defines the database connection and SQLAlchemy models for:
- Claims records
- Prediction audit logs
- Model version tracking
- User accounts (for role-based auth)
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    """User accounts with role-based access."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="admin")  # admin
    full_name = db.Column(db.String(120), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "full_name": self.full_name,
            "email": self.email,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Claim(db.Model):
    """Insurance claim records with prediction results."""
    __tablename__ = "claims"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Customer details
    customer_age = db.Column(db.Integer, nullable=False)
    customer_gender = db.Column(db.String(10), nullable=False)
    customer_region = db.Column(db.String(20), nullable=False)
    num_past_claims = db.Column(db.Integer, nullable=False, default=0)

    # Policy details
    policy_type = db.Column(db.String(30), nullable=False)
    coverage_amount = db.Column(db.Float, nullable=False)
    policy_start_date = db.Column(db.Date, nullable=False)
    policy_end_date = db.Column(db.Date, nullable=False)

    # Vehicle details
    vehicle_make = db.Column(db.String(30), nullable=False)
    vehicle_model = db.Column(db.String(30), nullable=False)
    vehicle_manufacture_year = db.Column(db.Integer, nullable=False)
    vehicle_age = db.Column(db.Integer, nullable=True)
    insured_declared_value = db.Column(db.Float, nullable=False)

    # Claim details
    damage_type = db.Column(db.String(30), nullable=False)
    damage_severity = db.Column(db.String(10), nullable=False)
    days_since_policy_start = db.Column(db.Integer, nullable=True)
    claim_amount_requested = db.Column(db.Float, nullable=False)
    claim_to_coverage_ratio = db.Column(db.Float, nullable=True)
    policy_duration_days = db.Column(db.Integer, nullable=True)

    # Prediction results
    fraud_probability = db.Column(db.Float, nullable=True)
    is_fraud = db.Column(db.Boolean, nullable=True)
    estimated_amount = db.Column(db.Float, nullable=True)
    risk_score = db.Column(db.Integer, nullable=True)
    risk_level = db.Column(db.String(10), nullable=True)

    # SHAP explanation (stored as JSON string)
    shap_explanation = db.Column(db.Text, nullable=True)

    # Status & metadata
    status = db.Column(db.String(20), default="pending")  # pending, processed, flagged, approved, rejected
    submitted_by = db.Column(db.String(80), nullable=True)
    reviewed_by = db.Column(db.String(80), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "customer_age": self.customer_age,
            "customer_gender": self.customer_gender,
            "customer_region": self.customer_region,
            "num_past_claims": self.num_past_claims,
            "policy_type": self.policy_type,
            "coverage_amount": self.coverage_amount,
            "policy_start_date": self.policy_start_date.isoformat() if self.policy_start_date else None,
            "policy_end_date": self.policy_end_date.isoformat() if self.policy_end_date else None,
            "vehicle_make": self.vehicle_make,
            "vehicle_model": self.vehicle_model,
            "vehicle_manufacture_year": self.vehicle_manufacture_year,
            "vehicle_age": self.vehicle_age,
            "insured_declared_value": self.insured_declared_value,
            "damage_type": self.damage_type,
            "damage_severity": self.damage_severity,
            "days_since_policy_start": self.days_since_policy_start,
            "claim_amount_requested": self.claim_amount_requested,
            "claim_to_coverage_ratio": self.claim_to_coverage_ratio,
            "policy_duration_days": self.policy_duration_days,
            "fraud_probability": self.fraud_probability,
            "is_fraud": self.is_fraud,
            "estimated_amount": self.estimated_amount,
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "shap_explanation": self.shap_explanation,
            "status": self.status,
            "submitted_by": self.submitted_by,
            "reviewed_by": self.reviewed_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class PredictionLog(db.Model):
    """Audit log for every prediction made (NFR7)."""
    __tablename__ = "prediction_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    claim_id = db.Column(db.Integer, db.ForeignKey("claims.id"), nullable=False)
    fraud_probability = db.Column(db.Float, nullable=True)
    is_fraud = db.Column(db.Boolean, nullable=True)
    estimated_amount = db.Column(db.Float, nullable=True)
    risk_score = db.Column(db.Integer, nullable=True)
    model_version = db.Column(db.String(50), nullable=True)
    predicted_by = db.Column(db.String(80), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "claim_id": self.claim_id,
            "fraud_probability": self.fraud_probability,
            "is_fraud": self.is_fraud,
            "estimated_amount": self.estimated_amount,
            "risk_score": self.risk_score,
            "model_version": self.model_version,
            "predicted_by": self.predicted_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ModelVersion(db.Model):
    """Model version tracking for reproducibility and rollback."""
    __tablename__ = "model_versions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    version = db.Column(db.String(50), unique=True, nullable=False)
    fraud_accuracy = db.Column(db.Float, nullable=True)
    fraud_precision = db.Column(db.Float, nullable=True)
    fraud_recall = db.Column(db.Float, nullable=True)
    fraud_f1 = db.Column(db.Float, nullable=True)
    fraud_auc_roc = db.Column(db.Float, nullable=True)
    amount_mae = db.Column(db.Float, nullable=True)
    amount_rmse = db.Column(db.Float, nullable=True)
    amount_r2 = db.Column(db.Float, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    trained_at = db.Column(db.DateTime, default=datetime.utcnow)
    trained_by = db.Column(db.String(80), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "version": self.version,
            "fraud_accuracy": self.fraud_accuracy,
            "fraud_precision": self.fraud_precision,
            "fraud_recall": self.fraud_recall,
            "fraud_f1": self.fraud_f1,
            "fraud_auc_roc": self.fraud_auc_roc,
            "amount_mae": self.amount_mae,
            "amount_rmse": self.amount_rmse,
            "amount_r2": self.amount_r2,
            "is_active": self.is_active,
            "trained_at": self.trained_at.isoformat() if self.trained_at else None,
            "trained_by": self.trained_by,
            "notes": self.notes,
        }
