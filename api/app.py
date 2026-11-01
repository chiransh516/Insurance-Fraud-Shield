"""
Flask Application Entry Point
================================
Insurance Claim Fraud & Amount Prediction System — API Server

Usage:
    python api/app.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from flask import Flask
from flask_cors import CORS

import config
from api.database import db, User
from api.routes.claims import claims_bp
from api.routes.dashboard import dashboard_bp
from api.routes.admin import admin_bp
from api.routes.auth import auth_bp


def create_app(test_config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # ---------------------------------------------------------------
    # Configuration
    # ---------------------------------------------------------------
    app.config["SQLALCHEMY_DATABASE_URI"] = config.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 3600,
        "pool_pre_ping": True,
    }
    app.config["JSON_SORT_KEYS"] = False

    if test_config:
        app.config.update(test_config)

    # ---------------------------------------------------------------
    # Extensions
    # ---------------------------------------------------------------
    CORS(app, origins="*")  # Allow React frontend
    db.init_app(app)

    # ---------------------------------------------------------------
    # Register Blueprints
    # ---------------------------------------------------------------
    app.register_blueprint(claims_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(auth_bp)

    # ---------------------------------------------------------------
    # Load ML Models on Startup
    # ---------------------------------------------------------------
    with app.app_context():
        _load_models(app)
        _init_database(app)

    # ---------------------------------------------------------------
    # Health Check
    # ---------------------------------------------------------------
    @app.route("/api/health", methods=["GET"])
    def health_check():
        models_loaded = all([
            app.config.get("FRAUD_MODEL"),
            app.config.get("AMOUNT_MODEL"),
            app.config.get("PREPROCESSOR"),
        ])
        return {
            "status": "healthy",
            "models_loaded": models_loaded,
            "database": "connected",
        }

    return app


def _load_models(app):
    """Load pre-trained ML models and preprocessor into app context."""
    try:
        from src.utils import load_model
        import pickle

        # 1. Try loading Fraud Classifier
        if os.path.exists(config.FRAUD_MODEL_PATH):
            app.config["FRAUD_MODEL"] = load_model(config.FRAUD_MODEL_PATH)
            print(f"  [OK] Fraud model loaded from {config.FRAUD_MODEL_PATH}")
        else:
            app.config["FRAUD_MODEL"] = None
            print(f"  [-] Fraud model not found at {config.FRAUD_MODEL_PATH}")

        # 2. Try loading Amount Regressor
        if os.path.exists(config.AMOUNT_MODEL_PATH):
            app.config["AMOUNT_MODEL"] = load_model(config.AMOUNT_MODEL_PATH)
            print(f"  [OK] Amount model loaded from {config.AMOUNT_MODEL_PATH}")
        else:
            app.config["AMOUNT_MODEL"] = None
            print(f"  [-] Amount model not found at {config.AMOUNT_MODEL_PATH}")

        # 3. Try loading Preprocessor
        if os.path.exists(config.PREPROCESSOR_PATH):
            app.config["PREPROCESSOR"] = load_model(config.PREPROCESSOR_PATH)
            print(f"  [OK] Preprocessor loaded from {config.PREPROCESSOR_PATH}")
        else:
            app.config["PREPROCESSOR"] = None
            print(f"  [-] Preprocessor not found at {config.PREPROCESSOR_PATH}")

        # 4. Try loading explainer if it exists
        explainer_path = os.path.join(config.MODELS_DIR, "explainer.pkl")
        if os.path.exists(explainer_path):
            with open(explainer_path, 'rb') as f:
                app.config['EXPLAINER'] = pickle.load(f)
            print(f"  [OK] SHAP explainer loaded from {explainer_path}")
        else:
            print("  [-] No pre-computed SHAP explainer found. It will be generated on the fly if needed.")
            
        print("Models loaded successfully!")
    except Exception as e:
        print(f"  [Error] Error loading models: {e}")
        app.config["FRAUD_MODEL"] = None
        app.config["AMOUNT_MODEL"] = None
        app.config["PREPROCESSOR"] = None


def _init_database(app):
    """Create database tables if needed."""
    db.create_all()
    print("  [OK] Database tables created/verified")


if __name__ == "__main__":
    app = create_app()
    print("\n" + "=" * 50)
    print("Insurance Fraud Detection API Server")
    print("=" * 50)
    print("Running on http://localhost:5000")
    print("API docs: POST/GET endpoints under /api/")
    print("=" * 50 + "\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
