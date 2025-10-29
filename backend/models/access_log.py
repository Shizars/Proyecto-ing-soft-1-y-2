from datetime import datetime
from backend.extensions import db


class AccessLog(db.Model):
    __tablename__ = "access_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=True)
    user_email = db.Column(db.String(255), nullable=True)
    ip = db.Column(db.String(64), nullable=True)
    user_agent = db.Column(db.String(512), nullable=True)
    created_at = db.Column(
        db.DateTime, default=datetime.utcnow, nullable=False)
