# backend/routes/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from itsdangerous import URLSafeTimedSerializer
from backend.extensions import db
from backend.models.user import User
from backend.services.email_service import send_reset_email

# Serializer para tokens de recuperación
serializer = URLSafeTimedSerializer("jwt-secret")

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    data = request.get_json()
    if User.query.filter_by(email=data["email"]).first():
        return {"error": "Email ya registrado"}, 409
    user = User(
        nombre_usuario=data["nombre_usuario"],
        email=data["email"],
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return {"msg": "Registro exitoso"}, 201


@auth_bp.post("/login")
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data["email"]).first()

    if not user or not user.check_password(data["password"]):
        return {"error": "Credenciales inválidas"}, 401
    token = create_access_token(identity=str(user.id))
    return jsonify(
        token=token,
        user={
            "id": user.id,
            "email": user.email,
            "nombre_usuario": user.nombre_usuario
        }
    )


@auth_bp.post("/forgot-password")
def forgot_password():
    """
    Envía un correo con enlace de recuperación si el email existe.
    """
    data = request.get_json()
    user = User.query.filter_by(email=data.get("email")).first()
    if user:
        # Generar token temporal (expira en 1 hora)
        token = serializer.dumps(user.email, salt="password-reset-salt")
        reset_link = f"http://localhost:3000/reset-password/{token}"
        # Envía el correo de recuperación
        try:
            send_reset_email(user.email, reset_link)
        except Exception as e:
            # Solo lo registramos, no interrumpimos el flujo
            print(f"Error enviando email a {user.email}: {e}")
    return {"msg": "Si existe ese correo, recibirás instrucciones."}, 200


@auth_bp.post("/reset-password")
def reset_password():
    """
    Recibe token y nueva contraseña, valida y actualiza la clave.
    """
    data = request.get_json()
    token = data.get("token")
    new_password = data.get("password")
    try:
        email = serializer.loads(
            token, salt="password-reset-salt", max_age=3600)
    except Exception:
        return {"error": "Token inválido o expirado."}, 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return {"error": "Usuario no encontrado."}, 404
    user.set_password(new_password)
    db.session.commit()
    return {"msg": "Contraseña actualizada."}, 200
