# backend/schemas/document_schema.py
from backend.extensions import ma
from backend.models.document import Document
from backend.schemas.tag_schema import TagSchema
from marshmallow import fields


class DocumentSchema(ma.SQLAlchemyAutoSchema):

    tags = fields.List(fields.Nested(TagSchema(only=("id", "nombre"))))

    class Meta:
        model = Document
        load_instance = True
        include_fk = True


doc_schema = DocumentSchema()
docs_schema = DocumentSchema(many=True)
