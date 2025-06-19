# backend/models/tag.py
from backend.extensions import db

# ---------------------------------------------------------------------------
# Tabla puente N-N documento_tags
# ---------------------------------------------------------------------------
document_tags = db.Table(
    "document_tags",
    db.Column("document_id", db.Integer, db.ForeignKey(
        "documents.id"), primary_key=True),
    db.Column("tag_id",       db.Integer, db.ForeignKey(
        "tags.id"),      primary_key=True)
)

# ---------------------------------------------------------------------------
# Modelo TAG
# ---------------------------------------------------------------------------


class Tag(db.Model):
    """
    Catálogo de etiquetas (keywords) que se pueden asignar a uno o más
    documentos para facilitar la búsqueda temática.
    """
    __tablename__ = "tags"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)

    # relación inversa ←→ Document
    documents = db.relationship(
        "Document",
        secondary=document_tags,
        back_populates="tags"
    )

    # --------- helpers opcionales ------------------------------------------
    def __repr__(self) -> str:
        return f"<Tag {self.nombre}>"

    @classmethod
    def get_or_create(cls, nombre: str) -> "Tag":
        """
        Devuelve una etiqueta existente (case-insensitive) o la crea.
        Útil cuando el usuario escribe libremente las palabras clave.
        """
        tag = cls.query.filter(db.func.lower(cls.nombre)
                               == nombre.lower()).first()
        if not tag:
            tag = cls(nombre=nombre)
            db.session.add(tag)
            db.session.commit()
        return tag
