from backend.extensions import ma
from marshmallow import fields
from backend.models.audit_record import AuditRecord
from backend.models.audit_item import AuditItem


class AuditItemSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = AuditItem
        load_instance = True
        include_fk = True


class AuditRecordSchema(ma.SQLAlchemyAutoSchema):
    items = fields.List(fields.Nested(AuditItemSchema))

    class Meta:
        model = AuditRecord
        load_instance = True
        include_fk = True


audit_item_schema = AuditItemSchema()
audit_items_schema = AuditItemSchema(many=True)
audit_schema = AuditRecordSchema()
audits_schema = AuditRecordSchema(many=True)
