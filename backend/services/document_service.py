import uuid

from pathlib import Path
from werkzeug.utils import secure_filename
from backend.extensions import db
from backend.models.document import Document
from sqlalchemy import delete
from backend.models.shared_link import SharedLink

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


def save_file(file_storage, owner_id, categoria="General"):
    """Guarda archivo y crea registro Document."""
    filename = secure_filename(file_storage.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = UPLOAD_DIR / unique_name
    file_storage.save(file_path)

    doc = Document(
        titulo=filename,
        file_path=str(file_path.relative_to(UPLOAD_DIR.parent)),
        formato=file_storage.mimetype.split("/")[-1],
        categoria=categoria,
        owner_id=owner_id,
    )
    db.session.add(doc)
    db.session.commit()
    return doc


def delete_document_for_owner(doc_id: int, owner_id: int) -> bool:
    """
    Elimina un documento si pertenece al owner.
    - Borra el archivo físico si existe
    - Borra enlaces compartidos asociados (si no están en cascade)
    - Borra el registro en DB
    Retorna True si borró, False si no encontró/permisos.
    """
    doc = Document.query.filter_by(id=doc_id, owner_id=owner_id).first()
    if not doc:
        return False

    # 1) borra archivo físico de forma segura
    abs_path: Path = (UPLOAD_DIR.parent / doc.file_path).resolve()
    try:
        # evita borrar fuera de /uploads
        if UPLOAD_DIR.parent.resolve() in abs_path.parents and abs_path.exists():
            abs_path.unlink(missing_ok=True)
    except Exception as e:
        # si no se pudo borrar el archivo, seguimos con la eliminación lógica
        print(f"[WARN] No se pudo borrar archivo {abs_path}: {e}")

    # 2) limpia SharedLink si no hay cascade a nivel modelo (opcional)
    try:
        db.session.execute(delete(SharedLink).where(
            SharedLink.document_id == doc.id))
    except Exception:
        pass

    # 3) borra el registro del documento
    db.session.delete(doc)
    db.session.commit()
    return True
