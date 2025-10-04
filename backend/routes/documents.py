# backend/routes/documents.py
from __future__ import annotations

import os
import uuid
from pathlib import Path
from datetime import datetime

from flask import Blueprint, request, send_file, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    verify_jwt_in_request,
)
from werkzeug.utils import secure_filename

from backend.extensions import db
from backend.services.document_service import save_file, UPLOAD_DIR
from backend.schemas.document_schema import docs_schema, doc_schema
from backend.models.document import Document
from backend.models.shared_link import SharedLink
from backend.models.document_comment import DocumentComment
from backend.schemas.document_comment_schema import DocumentCommentSchema

# --- Evidencias (modelo/esquema simples) ---
from backend.models.evidence import Evidence
from backend.schemas.evidence_schema import evidence_schema, evidences_schema

from backend.services.tag_service import (
    add_tags_to_document,
    remove_tag_from_document,
)

docs_bp = Blueprint("documents", __name__, url_prefix="/api/documents")

comment_schema = DocumentCommentSchema()
comments_schema = DocumentCommentSchema(many=True)

# ------------------ Config ------------------

# Extensiones permitidas para documentos principales
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "xlsx"}

# Extensiones permitidas para evidencias (sumamos imágenes)
ALLOWED_EVIDENCES = {"pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg"}

# Carpeta de evidencias: <UPLOAD_DIR>/evidences
EVIDENCE_DIR: Path = (UPLOAD_DIR / "evidences")
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def allowed_evidence(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EVIDENCES


def _build_public_url(doc: Document) -> str:
    relative = doc.file_path.replace("\\", "/")
    if relative.startswith("uploads/"):
        relative = relative[len("uploads/"):]
    return request.url_root.rstrip("/") + "/uploads/" + relative


# ===================== DOCUMENTOS =====================

@docs_bp.post("/upload")
@jwt_required()
def upload():
    if "file" not in request.files:
        return {"error": "No se envió archivo"}, 400

    file_obj = request.files["file"]
    if not allowed_file(file_obj.filename):
        return {
            "error": "Formato de archivo no permitido. Solo PDF, DOC, DOCX y XLSX son aceptados."
        }, 400

    user_id = get_jwt_identity()
    categoria = request.form.get("categoria", "General")

    # Duplicado por nombre (por usuario)
    allow_dup = request.form.get("allow_duplicate") in ("1", "true", "True")
    existing = Document.query.filter_by(
        owner_id=user_id, titulo=file_obj.filename).first()
    if existing and not allow_dup:
        return {
            "error": "DUPLICATE",
            "existing_id": existing.id,
            "message": f"Ya tienes un documento con el nombre '{file_obj.filename}'.",
        }, 409

    doc = save_file(file_obj, user_id, categoria)
    return {"msg": "Subido", "document": {"id": doc.id}}, 201


@docs_bp.get("/")
@jwt_required()
def listar():
    user_id = get_jwt_identity()
    docs = Document.query.filter_by(owner_id=user_id).all()
    return docs_schema.dump(docs), 200


@docs_bp.get("/<int:doc_id>/url")
@jwt_required()
def get_document_url(doc_id: int):
    user_id = get_jwt_identity()
    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    relative_path = doc.file_path.replace("\\", "/")
    if relative_path.startswith("uploads/"):
        relative_path = relative_path[len("uploads/"):]

    url = request.url_root.rstrip("/") + "/uploads/" + relative_path
    return {"url": url}, 200


@docs_bp.get("/<int:doc_id>/download")
@jwt_required()
def download(doc_id: int):
    user_id = get_jwt_identity()
    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    abs_path: Path = (UPLOAD_DIR.parent / doc.file_path).resolve()
    if not abs_path.exists():
        return {"error": "Archivo no disponible"}, 404

    return send_file(
        abs_path,
        as_attachment=True,
        download_name=doc.titulo,
        mimetype="application/octet-stream",
    )


# ===================== ENLACE COMPARTIDO =====================

@docs_bp.get("/shared/<token>/url")  # sin @jwt_required
def obtener_url_compartida(token: str):
    # Si viene JWT, bien; si no, seguimos igual
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        pass

    link = SharedLink.query.filter_by(token=token).first()
    if not link:
        return {"error": "Enlace inexistente"}, 404
    if link.expires_at < datetime.utcnow():
        return {"error": "Enlace vencido"}, 410

    doc = Document.query.get(link.document_id)
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    return {"url": _build_public_url(doc)}, 200


@docs_bp.post("/<int:doc_id>/share")
@jwt_required()
def crear_link_compartido(doc_id: int):
    user_id = get_jwt_identity()
    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    link = SharedLink.new(document_id=doc.id, owner_id=user_id)
    full_url = request.url_root.rstrip(
        "/") + f"/api/documents/shared/{link.token}/url"
    return {"url": full_url}, 201


# ===================== TAGS =====================

@docs_bp.post("/<int:doc_id>/tags")
@jwt_required()
def set_tags(doc_id: int):
    tag_names = request.json.get("tags", [])
    doc = add_tags_to_document(doc_id, tag_names)
    return doc_schema.dump(doc), 200


@docs_bp.delete("/<int:doc_id>/tags/<int:tag_id>")
@jwt_required()
def delete_tag(doc_id: int, tag_id: int):
    doc = remove_tag_from_document(doc_id, tag_id)
    return doc_schema.dump(doc), 200


# ===================== BORRAR / FAVORITOS =====================

@docs_bp.delete("/<int:doc_id>")
@jwt_required()
def delete_document(doc_id: int):
    user_id = get_jwt_identity()
    from backend.services.document_service import delete_document_for_owner

    ok = delete_document_for_owner(doc_id, user_id)
    if not ok:
        return {"error": "Documento no encontrado o sin permisos"}, 404
    return {"msg": "Documento eliminado"}, 200


@docs_bp.post("/<int:doc_id>/favorite/toggle")
@jwt_required()
def toggle_favorite(doc_id: int):
    user_id = get_jwt_identity()
    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    doc.is_favorite = not bool(doc.is_favorite)
    db.session.commit()
    return {"id": doc.id, "is_favorite": doc.is_favorite}, 200


@docs_bp.post("/<int:doc_id>/favorite")
@jwt_required()
def set_favorite(doc_id: int):
    want = bool(request.json.get("is_favorite", True))
    user_id = get_jwt_identity()
    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    doc.is_favorite = want
    db.session.commit()
    return {"id": doc.id, "is_favorite": doc.is_favorite}, 200


@docs_bp.get("/favorites")
@jwt_required()
def list_favorites():
    user_id = get_jwt_identity()
    docs = Document.query.filter_by(owner_id=user_id, is_favorite=True).all()
    return docs_schema.dump(docs), 200


# ===================== COMENTARIOS =====================

@docs_bp.get("/<int:doc_id>/comments")
@jwt_required()
def list_comments(doc_id: int):
    user_id = get_jwt_identity()
    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    rows = (
        DocumentComment.query.filter_by(document_id=doc_id)
        .order_by(DocumentComment.created_at.desc())
        .all()
    )
    return comments_schema.dump(rows), 200


@docs_bp.post("/<int:doc_id>/comments")
@jwt_required()
def add_comment(doc_id: int):
    user_id = get_jwt_identity()
    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    body = (request.json or {}).get("body", "").strip()
    if not body:
        return {"error": "El comentario no puede estar vacío"}, 400

    c = DocumentComment(document_id=doc_id, owner_id=user_id, body=body)
    db.session.add(c)
    db.session.commit()
    return comment_schema.dump(c), 201


@docs_bp.delete("/comments/<int:comment_id>")
@jwt_required()
def delete_comment(comment_id: int):
    user_id = get_jwt_identity()

    c = DocumentComment.query.get(comment_id)
    if not c:
        return {"error": "Comentario no encontrado"}, 404

    doc = Document.query.get(c.document_id)
    if c.owner_id != user_id and doc.owner_id != user_id:
        return {"error": "Sin permisos para eliminar"}, 403

    db.session.delete(c)
    db.session.commit()
    return {"msg": "Comentario eliminado"}, 200


# ===================== ARCHIVO/CARPETAS =====================

ALLOWED_FOLDERS = {"F-SGC-033-B", "F-SGC-036"}


@docs_bp.patch("/<int:doc_id>/archive")
@jwt_required()
def archive_document(doc_id: int):
    user_id = get_jwt_identity()

    data = request.get_json() or {}
    folder_code = (data.get("folder_code") or "").strip()
    if folder_code not in ALLOWED_FOLDERS:
        return {"error": "Carpeta inválida"}, 400

    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    doc.archived = True
    doc.folder_code = folder_code
    db.session.commit()
    return {"id": doc.id, "archived": doc.archived, "folder_code": doc.folder_code}, 200


@docs_bp.patch("/<int:doc_id>/unarchive")
@jwt_required()
def unarchive_document(doc_id: int):
    user_id = get_jwt_identity()

    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    doc.archived = False
    doc.folder_code = None
    db.session.commit()
    return {"id": doc.id, "archived": doc.archived, "folder_code": doc.folder_code}, 200


# ===================== RENOMBRAR =====================

@docs_bp.put("/<int:doc_id>/rename")
@jwt_required()
def rename_document(doc_id: int):
    user_id = get_jwt_identity()
    data = request.json or {}
    nuevo_nombre = (data.get("titulo") or "").strip()

    if not nuevo_nombre:
        return {"error": "Se requiere un nuevo nombre"}, 400

    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    doc.titulo = nuevo_nombre
    db.session.commit()
    return {"msg": "Documento renombrado con éxito", "document": {"id": doc.id, "titulo": doc.titulo}}, 200


# ===================== EVIDENCIAS =====================

@docs_bp.post("/<int:doc_id>/evidences")
@jwt_required()
def upload_evidence(doc_id: int):
    """Sube 1 archivo de evidencia y lo asocia al documento."""
    user_id = get_jwt_identity()
    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    f = request.files.get("file")
    if not f:
        return {"error": "No se envió archivo"}, 400
    if not allowed_evidence(f.filename):
        return {"error": "Formato de evidencia no permitido"}, 400

    safe = secure_filename(f.filename)
    unique = f"ev_{uuid.uuid4().hex}_{safe}"
    abs_path = (EVIDENCE_DIR / unique).resolve()
    f.save(str(abs_path))

    # Guardamos ruta relativa respecto a uploads/
    rel_path = os.path.relpath(abs_path, UPLOAD_DIR.parent)

    ev = Evidence(document_id=doc.id, filename=safe, file_path=rel_path)
    db.session.add(ev)
    db.session.commit()

    return {"msg": "Evidencia subida", "evidence": evidence_schema.dump(ev)}, 201


@docs_bp.get("/<int:doc_id>/evidences")
@jwt_required()
def list_evidences(doc_id: int):
    """Lista evidencias asociadas a un documento del usuario."""
    user_id = get_jwt_identity()
    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    rows = Evidence.query.filter_by(document_id=doc.id).order_by(
        Evidence.uploaded_at.desc()).all()
    return {"items": evidences_schema.dump(rows)}, 200
