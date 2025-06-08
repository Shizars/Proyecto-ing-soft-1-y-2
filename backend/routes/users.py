from flask import Blueprint
from flask_jwt_extended import jwt_required
from backend.schemas.user_schema import users_schema
from backend.models.user import User

users_bp = Blueprint("users", __name__, url_prefix="/api/usuarios")


@users_bp.get("/")
@jwt_required()
def listar_usuarios():
    usuarios = User.query.all()
    return users_schema.dump(usuarios), 200
