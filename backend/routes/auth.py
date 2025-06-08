from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from backend.extensions import db
from backend.models.user import User

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
    token = create_access_token(identity=user.id)
    return jsonify(token=token, user={"id": user.id, "email": user.email})
