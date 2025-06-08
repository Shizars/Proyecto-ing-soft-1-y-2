# backend/schemas/document_schema.py
from backend.extensions import ma
from backend.models.document import Document


class DocumentSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Document
        load_instance = True
        include_fk = True


doc_schema = DocumentSchema()
docs_schema = DocumentSchema(many=True)
