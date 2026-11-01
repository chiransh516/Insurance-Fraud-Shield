"""
Authentication Routes
=====================
Handles user registration, login, and token generation.
"""

from flask import Blueprint, request, jsonify
from api.database import db, User
from api.auth import hash_password, verify_password, create_token
import config

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Missing username or password"}), 400
        
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 400
        
    role = data.get("role", config.ROLE_USER)
    
    email_val = data.get("email", "").strip()
    full_name_val = data.get("full_name", "").strip()
    
    new_user = User(
        username=data["username"],
        password_hash=hash_password(data["password"]),
        role=role,
        full_name=full_name_val if full_name_val else None,
        email=email_val if email_val else None
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "role": new_user.role
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Missing username or password"}), 400
        
    user = User.query.filter_by(username=data["username"]).first()
    
    if not user or not verify_password(data["password"], user.password_hash):
        return jsonify({"error": "Invalid username or password"}), 401
        
    token = create_token(user.id, user.username, user.role)
    
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "full_name": user.full_name
        }
    }), 200
