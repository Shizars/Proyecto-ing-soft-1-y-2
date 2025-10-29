from backend.extensions import ma
from backend.models.access_log import AccessLog


class AccessLogSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = AccessLog
        load_instance = True
        include_fk = True
        ordered = True
        fields = ("id", "user_id", "user_email",
                  "ip", "user_agent", "created_at")


access_log_schema = AccessLogSchema()
access_logs_schema = AccessLogSchema(many=True)
