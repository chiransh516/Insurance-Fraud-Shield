"""
JWT Role-Based Authentication
===============================
Simple JWT auth with 3 roles: admin, claims_officer, viewer.
"""

import functools
from datetime import datetime, timedelta
from flask import request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
import jwt

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


def create_token(user_id: int, username: str, role: str) -> str:
    """Create a JWT token for the given user."""
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=config.JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        return jwt.decode(token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """Decorator that requires a valid JWT token in the Authorization header."""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
            
        token = auth_header.split(" ")[1]
        decoded = decode_token(token)
        
        if not decoded:
            return jsonify({"error": "Token is invalid or expired"}), 401
            
        g.current_user = decoded
        return f(*args, **kwargs)

    return decorated


def role_required(*allowed_roles):
    """
    Decorator that requires the user to have one of the specified roles.

    Usage:
        @role_required("admin", "claims_officer")
        def some_endpoint():
            ...
    """
    def decorator(f):
        @functools.wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            user_role = g.current_user.get("role", "")
            if user_role not in allowed_roles:
                return jsonify({
                    "error": f"Access denied. Required role(s): {', '.join(allowed_roles)}"
                }), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def hash_password(password: str) -> str:
    """Hash a password for storage."""
    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    return check_password_hash(password_hash, password)
