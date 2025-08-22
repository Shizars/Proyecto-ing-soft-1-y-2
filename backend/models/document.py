from datetime import datetime
from backend.extensions import db
from .document_tags import document_tags

# document.py


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    categoria = db.Column(db.String(50), index=True)
    # admite “application/pdf” si hiciera falta
    formato = db.Column(db.String(20))
    fecha_subida = db.Column(db.DateTime, default=datetime.utcnow)

    owner_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    owner = db.relationship(
        "User", back_populates="documentos", passive_deletes=True)

    tags = db.relationship(
        "Tag",
        secondary=document_tags,
        back_populates="documents",
        cascade="all, delete",
        passive_deletes=True,
    )

    # Índices útiles para búsquedas frecuentes
    __table_args__ = (
        db.Index("idx_documents_owner", "owner_id"),
        db.Index("idx_documents_categoria", "categoria"),
    )

    def __repr__(self):
        return f"<Document {self.titulo}>"
