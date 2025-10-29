# backend/routes/users.py
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.schemas.user_schema import users_schema
from backend.models.user import User

# Usa /api/users para que coincida con el frontend (updateProfile -> PUT /api/users/me)
users_bp = Blueprint("users", __name__, url_prefix="/api/users")


@users_bp.get("/")
@jwt_required()
def listar_usuarios():
    usuarios = User.query.all()
    return users_schema.dump(usuarios), 200


@users_bp.put("/me")
@jwt_required()
def update_me():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user:
        return {"error": "Usuario no encontrado"}, 404

    data = request.get_json() or {}
    nombre = (data.get("nombre_usuario") or "").strip()
    email = (data.get("email") or "").strip()

    if not nombre or not email:
        return {"error": "Nombre y correo son obligatorios"}, 400

    # Si cambias el correo, valida duplicado
    if email != user.email and User.query.filter_by(email=email).first():
        return {"error": "El correo ya está en uso"}, 409

    user.nombre_usuario = nombre
    user.email = email
    db.session.commit()

    return {
        "user": {
            "id": user.id,
            "nombre_usuario": user.nombre_usuario,
            "email": user.email,
        }
    }, 200
