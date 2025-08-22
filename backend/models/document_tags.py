from backend.extensions import db
# document_tags.py
# Tabla puente (N-N) entre documentos y tags
document_tags = db.Table(
    "document_tags",
    db.Column(
        "document_id",
        db.Integer,
        db.ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "tag_id",
        db.Integer,
        db.ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
