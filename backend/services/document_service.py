import uuid

from pathlib import Path
from werkzeug.utils import secure_filename
from backend.extensions import db
from backend.models.document import Document

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
