from datetime import datetime, timedelta
from uuid import uuid4
from backend.extensions import db


class SharedLink(db.Model):
    __tablename__ = "shared_links"

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(64), unique=True, nullable=False)
    document_id = db.Column(db.Integer,
                            db.ForeignKey("documents.id", ondelete="CASCADE"),
                            nullable=False)
    owner_id = db.Column(db.Integer,
                         db.ForeignKey("users.id", ondelete="CASCADE"),
                         nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime,
                           default=lambda: datetime.utcnow() + timedelta(days=7))

    # relaciones (opcionales, para consultas cómodas)
    document = db.relationship("Document")
    owner = db.relationship("User")

    @staticmethod
    def new(document_id: int, owner_id: int, ttl_days: int = 7) -> "SharedLink":
        link = SharedLink(
            token=uuid4().hex,
            document_id=document_id,
            owner_id=owner_id,
            expires_at=datetime.utcnow() + timedelta(days=ttl_days),
        )
        db.session.add(link)
        db.session.commit()
        return link
