# backend/models/document_tags.py

from backend.extensions import db

# Tabla intermedia para la relación muchos a muchos entre documentos y etiquetas
document_tags = db.Table(
    "document_tags",
    db.Column("document_id", db.Integer, db.ForeignKey("documents.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tags.id"), primary_key=True)
)
