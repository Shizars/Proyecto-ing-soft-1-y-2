# backend/schemas/document_schema.py
from backend.extensions import ma
from backend.models.document import Document
from backend.schemas.tag_schema import TagSchema
from marshmallow import fields


class DocumentSchema(ma.SQLAlchemyAutoSchema):
    # relaciones/derivados
    tags = fields.List(fields.Nested(TagSchema(only=("id", "nombre"))))

    # columnas simples (explícitas por claridad)
    archived = fields.Boolean()
    folder_code = fields.String(allow_none=True)
    is_favorite = fields.Boolean()

    # ⬅️ clave para papelera/restore
    deleted_at = fields.DateTime(allow_none=True, dump_only=True)

    # opcional: si quieres asegurar tipos/solo-lectura
    fecha_subida = fields.DateTime(dump_only=True)

    class Meta:
        model = Document
        load_instance = True
        include_fk = True
        # include_relationships no es necesario porque 'tags' la declaramos arriba


doc_schema = DocumentSchema()
docs_schema = DocumentSchema(many=True)
