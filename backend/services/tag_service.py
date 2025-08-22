# backend/services/tag_service.py
from backend.extensions import db
from backend.models.document import Document
from backend.models.tag import Tag


def add_tags_to_document(doc_id: int, tag_names: list[str]) -> Document:
    """
    Crea (si es necesario) y asocia cada etiqueta al documento.
    Devuelve la instancia de Document actualizada.
    """
    document = Document.query.get_or_404(doc_id)

    for raw in tag_names:
        name = raw.strip().lower()
        if not name:
            continue
        tag = Tag.query.filter(db.func.lower(Tag.nombre) == name).first()
        if not tag:
            tag = Tag(nombre=name)
            db.session.add(tag)
        if tag not in document.tags:
            document.tags.append(tag)

    db.session.commit()
    return document


def remove_tag_from_document(doc_id: int, tag_id: int) -> Document:
    """Desasocia una etiqueta existente del documento (no la elimina globalmente)."""
    document = Document.query.get_or_404(doc_id)
    tag = Tag.query.get_or_404(tag_id)

    if tag in document.tags:
        document.tags.remove(tag)
        db.session.commit()

    return document
