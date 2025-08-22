from backend.extensions import db
from .document_tags import document_tags

# tag.py


class Tag(db.Model):
    """Catálogo de etiquetas asignables a uno o más documentos."""
    __tablename__ = "tags"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)

    # relación inversa ←→ Document
    documents = db.relationship(
        "Document",
        secondary=document_tags,
        back_populates="tags",
        cascade="all, delete",
        passive_deletes=True,
        lazy="dynamic",
    )

    # ───────── helpers ─────────
    def __repr__(self) -> str:
        return f"<Tag {self.nombre}>"

    @classmethod
    def get_or_create(cls, nombre: str) -> "Tag":
        """Devuelve una etiqueta existente (case-insensitive) o la crea."""
        tag = cls.query.filter(db.func.lower(cls.nombre)
                               == nombre.lower()).first()
        if not tag:
            tag = cls(nombre=nombre)
            db.session.add(tag)
            db.session.commit()
        return tag
