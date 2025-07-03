import io
import os
import pathlib
from werkzeug.datastructures import FileStorage

from backend.services.document_service import save_file, UPLOAD_DIR
from backend.models.user import User


def test_save_file_creates_doc(db):
    # ── Usuario ──────────────────────────────────────────────────────────
    u = User(nombre_usuario="u2", email="u2@mail")
    u.set_password("x")
    db.session.add(u)
    db.session.commit()

    # ── Archivo de prueba en memoria (FileStorage) ──────────────────────
    stream = io.BytesIO(b"PDF")
    file_storage = FileStorage(
        stream=stream,
        filename="demo.pdf",
        content_type="application/pdf",
    )

    doc = save_file(file_storage, owner_id=u.id, categoria="Test")

    # ── Verificaciones ──────────────────────────────────────────────────
    assert doc.id is not None
    abs_path = pathlib.Path(UPLOAD_DIR.parent / doc.file_path)
    assert abs_path.exists() and abs_path.read_bytes() == b"PDF"

    # limpieza
    os.remove(abs_path)
