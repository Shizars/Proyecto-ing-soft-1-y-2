from datetime import datetime
from backend.extensions import db

document_tags = db.Table(
    "document_tags",
    db.Column("document_id", db.Integer, db.ForeignKey("documents.id")),
    db.Column("tag_id", db.Integer, db.ForeignKey("tags.id")),
)


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    categoria = db.Column(db.String(50))
    formato = db.Column(db.String(10))
    fecha_subida = db.Column(db.DateTime, default=datetime.utcnow)

    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    owner = db.relationship("User", back_populates="documentos")

    tags = db.relationship(
        "Tag", secondary=document_tags, back_populates="documents"
    )

    def __repr__(self):
        return f"<Document {self.titulo}>"


class Tag(db.Model):
    __tablename__ = "tags"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)
    documents = db.relationship(
        "Document", secondary=document_tags, back_populates="tags"
    )

    def __repr__(self):
        return f"<Tag {self.nombre}>"
