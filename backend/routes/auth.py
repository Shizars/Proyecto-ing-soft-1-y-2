# backend/routes/auth.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
from itsdangerous import URLSafeTimedSerializer, BadTimeSignature, SignatureExpired

from backend.extensions import db
from backend.models.user import User
from backend.models.access_log import AccessLog
from backend.services.email_service import send_reset_email

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _get_serializer():
    """
    Crea un serializer basado en SECRET_KEY de la app.
    Evita claves hardcodeadas.
    """
    secret = current_app.config.get("SECRET_KEY", "jwt-secret")
    return URLSafeTimedSerializer(secret_key=secret)


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    required = {"nombre_usuario", "email", "password"}
    if not required.issubset(data.keys()):
        return {"error": "Faltan campos requeridos"}, 400

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
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {"error": "Faltan credenciales"}, 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return {"error": "Credenciales inválidas"}, 401

    # Emitir JWT
    token = create_access_token(identity=str(user.id))

    # Registrar acceso (login exitoso)
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    # Si hay varios IPs en XFF, tomar el primero
    if ip and isinstance(ip, str) and "," in ip:
        ip = ip.split(",")[0].strip()

    user_agent = (request.headers.get("User-Agent") or "")[:512]

    db.session.add(
        AccessLog(
            user_id=user.id,
            user_email=user.email,
            ip=ip,
            user_agent=user_agent,
        )
    )
    db.session.commit()

    return jsonify(
        token=token,
        user={
            "id": user.id,
            "email": user.email,
            "nombre_usuario": user.nombre_usuario,
        },
    ), 200


@auth_bp.post("/forgot-password")
def forgot_password():
    """
    Envía un correo con enlace de recuperación si el email existe.
    """
    data = request.get_json() or {}
    email = data.get("email")
    if not email:
        return {"error": "Email requerido"}, 400

    user = User.query.filter_by(email=email).first()
    if user:
        try:
            serializer = _get_serializer()
            # Token expirable: lo validaremos con max_age=3600 en el endpoint de reset
            token = serializer.dumps(user.email, salt="password-reset-salt")
            reset_link = f"{current_app.config.get('FRONTEND_BASE_URL', 'http://localhost:3000')}/reset-password/{token}"
            send_reset_email(user.email, reset_link)
        except Exception as e:
            # No exponemos detalles; solo dejamos traza en consola/log
            print(f"[forgot-password] Error enviando email a {email}: {e}")

    # Respuesta genérica para no filtrar existencia de cuentas
    return {"msg": "Si existe ese correo, recibirás instrucciones."}, 200


@auth_bp.post("/reset-password")
def reset_password():
    """
    Recibe token y nueva contraseña, valida y actualiza la clave.
    """
    data = request.get_json() or {}
    token = data.get("token")
    new_password = data.get("password")

    if not token or not new_password:
        return {"error": "Token y nueva contraseña son requeridos."}, 400

    serializer = _get_serializer()
    try:
        email = serializer.loads(
            token, salt="password-reset-salt", max_age=3600)  # 1 hora
    except SignatureExpired:
        return {"error": "Token expirado."}, 400
    except BadTimeSignature:
        return {"error": "Token inválido."}, 400
    except Exception:
        return {"error": "Token inválido."}, 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return {"error": "Usuario no encontrado."}, 404

    user.set_password(new_password)
    db.session.commit()
    return {"msg": "Contraseña actualizada."}, 200
