# tests/test_documents_routes.py
from backend.models.user import User
from backend.services.document_service import save_file
from werkzeug.datastructures import FileStorage
import io
import os
import pathlib
from backend.services.document_service import UPLOAD_DIR


def make_doc(db, owner_id):
    dummy = FileStorage(stream=io.BytesIO(
        b"X"), filename="t.pdf", content_type="application/pdf")
    return save_file(dummy, owner_id=owner_id, categoria="Test")


def test_download_rejects_foreign_doc(client, db):
    # Usuario A con documento propio
    ua = User(nombre_usuario="a", email="a@mail")
    ua.set_password("x")
    db.session.add(ua)
    # Usuario B autenticado vía token
    ub = User(nombre_usuario="b", email="b@mail")
    ub.set_password("x")
    db.session.add(ub)
    db.session.commit()

    doc_a = make_doc(db, ua.id)

    # Simula token de B
    token = client.post(
        "/api/auth/login", json={"email": "b@mail", "password": "x"}).get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(f"/api/documents/{doc_a.id}/download", headers=headers)

    assert res.status_code == 404
