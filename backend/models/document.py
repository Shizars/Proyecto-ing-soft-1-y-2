# backend/models/document.py
from datetime import datetime
from backend.extensions import db
from .document_tags import document_tags


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    categoria = db.Column(db.String(50), index=True)
    formato = db.Column(db.String(20))  # ej: "application/pdf"
    fecha_subida = db.Column(db.DateTime, default=datetime.utcnow)

    is_favorite = db.Column(db.Boolean, nullable=False,
                            server_default="0", index=True)

    archived = db.Column(db.Boolean, nullable=False,
                         server_default="0", index=True)
    # Carpeta fija: "F-SGC-033-B", "F-SGC-036"
    folder_code = db.Column(db.String(50), index=True)

    # 🔹 Nuevo: campo para soft delete (papelera)
    deleted_at = db.Column(db.DateTime, nullable=True, index=True)

    # Relaciones
    owner_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    owner = db.relationship(
        "User", back_populates="documentos", passive_deletes=True
    )

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

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def __repr__(self):
        return f"<Document {self.titulo}>"
