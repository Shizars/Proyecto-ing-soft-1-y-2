from backend.extensions import ma
from marshmallow import fields
from backend.models.document_comment import DocumentComment


class DocumentCommentSchema(ma.SQLAlchemySchema):
    class Meta:
        model = DocumentComment
        load_instance = True

    id = ma.auto_field()
    document_id = ma.auto_field()
    owner_id = ma.auto_field(dump_only=True)
    body = ma.auto_field()
    created_at = fields.DateTime()
