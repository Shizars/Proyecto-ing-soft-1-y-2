from backend.extensions import db
from datetime import datetime


class Evidence(db.Model):
    __tablename__ = "evidences"

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey(
        "documents.id", ondelete="CASCADE"), nullable=False)

    filename = db.Column(db.String(255), nullable=False)
    # relativo a tu carpeta de uploads
    file_path = db.Column(db.String(500), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
