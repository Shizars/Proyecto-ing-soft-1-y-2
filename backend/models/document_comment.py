from datetime import datetime
from backend.extensions import db


class DocumentComment(db.Model):
    __tablename__ = "document_comments"
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey(
        "documents.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = db.Column(db.Integer, db.ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False, index=True)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # relaciones opcionales (no necesarias para funcionar)
    document = db.relationship("Document", backref=db.backref(
        "comments", cascade="all, delete-orphan"))
