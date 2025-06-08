# backend/schemas/user_schema.py
from backend.extensions import ma
from backend.models.user import User


class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        include_relationships = True
        exclude = ("password_hash",)      # nunca enviamos la contraseña


user_schema = UserSchema()
users_schema = UserSchema(many=True)
