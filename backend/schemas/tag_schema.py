# backend/schemas/tag_schema.py
from backend.extensions import ma
from backend.models.tag import Tag


class TagSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Tag
        load_instance = True
        include_fk = False
