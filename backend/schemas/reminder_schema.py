from marshmallow import Schema, fields


class ReminderSchema(Schema):
    id = fields.Int()
    title = fields.Str(required=True)
    due_at = fields.DateTime(required=True)  # ISO 8601 UTC
    done = fields.Bool()
    created_at = fields.DateTime()
    owner_id = fields.Int()
