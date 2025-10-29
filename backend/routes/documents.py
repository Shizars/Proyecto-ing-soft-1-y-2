# backend/routes/documents.py
from __future__ import annotations

import os
from io import BytesIO
import tempfile
import zipfile
import uuid
from pathlib import Path
from datetime import datetime

from flask import Blueprint, request, send_file
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

# Evidencias
from backend.models.evidence import Evidence
from backend.schemas.evidence_schema import evidence_schema, evidences_schema

# Tags
from backend.services.tag_service import add_tags_to_document, remove_tag_from_document

docs_bp = Blueprint("documents", __name__, url_prefix="/api/documents")

comment_schema = DocumentCommentSchema()
comments_schema = DocumentCommentSchema(many=True)

# ------------------ Config ------------------

# Extensiones permitidas para documentos principales
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "xlsx"}

# Extensiones permitidas para evidencias (incluye imágenes)
ALLOWED_EVIDENCES = {"pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg"}

# Carpeta de evidencias: <UPLOAD_DIR>/evidences
EVIDENCE_DIR: Path = (UPLOAD_DIR / "evidences")
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)

# Carpetas fijas permitidas para archivar
ALLOWED_FOLDERS = {"F-SGC-033-B", "F-SGC-036"}


# ------------------ Helpers ------------------

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def allowed_evidence(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EVIDENCES


def _build_public_url(doc: Document) -> str:
    """
    Construye URL pública a partir de file_path guardado (relativo a /uploads).
    """
    relative = doc.file_path.replace("\\", "/")
    if relative.startswith("uploads/"):
        relative = relative[len("uploads/"):]
    return request.url_root.rstrip("/") + "/uploads/" + relative


def _get_owned_doc_or_404(doc_id: int, user_id: int) -> Document | None:
    """
    Obtiene un doc por id y dueño. Devuelve None si no existe.
    """
    return Document.query.filter_by(id=doc_id, owner_id=user_id).first()


# ===================== DOCUMENTOS =====================

@docs_bp.post("/upload")
@jwt_required()
def upload():
    if "file" not in request.files:
        return {"error": "No se envió archivo"}, 400

    file_obj = request.files["file"]
    if not allowed_file(file_obj.filename):
        return {
            "error": "Formato de archivo no permitido. Solo PDF, DOC, DOCX y XLSX."
        }, 400

    user_id = get_jwt_identity()
    categoria = request.form.get("categoria", "General")

    # Evitar duplicado por nombre (por usuario), a menos que allow_duplicate=1/true
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
    """
    Lista documentos del usuario. Por defecto excluye papelera.
    ?include_deleted=1 para incluir los eliminados (soft delete).
    """
    user_id = get_jwt_identity()
    include_deleted = request.args.get(
        "include_deleted") in ("1", "true", "True")

    q = Document.query.filter_by(owner_id=user_id)
    if not include_deleted:
        q = q.filter(Document.deleted_at.is_(None))

    docs = q.all()
    return docs_schema.dump(docs), 200


@docs_bp.get("/<int:doc_id>/url")
@jwt_required()
def get_document_url(doc_id: int):
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    return {"url": _build_public_url(doc)}, 200


@docs_bp.get("/<int:doc_id>/download")
@jwt_required()
def download(doc_id: int):
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

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

@docs_bp.get("/shared/<token>/url")   # sin @jwt_required
def obtener_url_compartida(token: str):
    """
    Devuelve URL pública del archivo a partir de un token de share válido y no vencido.
    Acepta JWT opcional (no requerido).
    """
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
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    return {"url": _build_public_url(doc)}, 200


@docs_bp.post("/<int:doc_id>/share")
@jwt_required()
def crear_link_compartido(doc_id: int):
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    link = SharedLink.new(document_id=doc.id, owner_id=user_id)
    full_url = request.url_root.rstrip(
        "/") + f"/api/documents/shared/{link.token}/url"
    return {"url": full_url}, 201


# ===================== TAGS =====================

@docs_bp.post("/<int:doc_id>/tags")
@jwt_required()
def set_tags(doc_id: int):
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    tag_names = request.json.get("tags", [])
    saved = add_tags_to_document(doc_id, tag_names)
    return doc_schema.dump(saved), 200


@docs_bp.delete("/<int:doc_id>/tags/<int:tag_id>")
@jwt_required()
def delete_tag(doc_id: int, tag_id: int):
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    saved = remove_tag_from_document(doc_id, tag_id)
    return doc_schema.dump(saved), 200


# ===================== FAVORITOS =====================

@docs_bp.post("/<int:doc_id>/favorite/toggle")
@jwt_required()
def toggle_favorite(doc_id: int):
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    doc.is_favorite = not bool(doc.is_favorite)
    db.session.commit()
    return {"id": doc.id, "is_favorite": doc.is_favorite}, 200


@docs_bp.post("/<int:doc_id>/favorite")
@jwt_required()
def set_favorite(doc_id: int):
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    want = bool(request.json.get("is_favorite", True))
    doc.is_favorite = want
    db.session.commit()
    return {"id": doc.id, "is_favorite": doc.is_favorite}, 200


@docs_bp.get("/favorites")
@jwt_required()
def list_favorites():
    user_id = get_jwt_identity()
    docs = (
        Document.query
        .filter_by(owner_id=user_id, is_favorite=True)
        .filter(Document.deleted_at.is_(None))  # no mostrar de papelera
        .all()
    )
    return docs_schema.dump(docs), 200


# ===================== COMENTARIOS =====================

@docs_bp.get("/<int:doc_id>/comments")
@jwt_required()
def list_comments(doc_id: int):
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    rows = (
        DocumentComment.query
        .filter_by(document_id=doc_id)
        .order_by(DocumentComment.created_at.desc())
        .all()
    )
    return comments_schema.dump(rows), 200


@docs_bp.post("/<int:doc_id>/comments")
@jwt_required()
def add_comment(doc_id: int):
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

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
    if not doc:
        return {"error": "Documento no encontrado"}, 404
    if c.owner_id != user_id and doc.owner_id != user_id:
        return {"error": "Sin permisos para eliminar"}, 403
    if doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    db.session.delete(c)
    db.session.commit()
    return {"msg": "Comentario eliminado"}, 200


# ===================== ARCHIVO/CARPETAS =====================

@docs_bp.patch("/<int:doc_id>/archive")
@jwt_required()
def archive_document(doc_id: int):
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    data = request.get_json() or {}
    folder_code = (data.get("folder_code") or "").strip()
    if folder_code not in ALLOWED_FOLDERS:
        return {"error": "Carpeta inválida"}, 400

    doc.archived = True
    doc.folder_code = folder_code
    db.session.commit()
    return {"id": doc.id, "archived": doc.archived, "folder_code": doc.folder_code}, 200


@docs_bp.patch("/<int:doc_id>/unarchive")
@jwt_required()
def unarchive_document(doc_id: int):
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    doc.archived = False
    doc.folder_code = None
    db.session.commit()
    return {"id": doc.id, "archived": doc.archived, "folder_code": doc.folder_code}, 200


# ===================== RENOMBRAR =====================

@docs_bp.put("/<int:doc_id>/rename")
@jwt_required()
def rename_document(doc_id: int):
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    data = request.json or {}
    nuevo_nombre = (data.get("titulo") or "").strip()
    if not nuevo_nombre:
        return {"error": "Se requiere un nuevo nombre"}, 400

    doc.titulo = nuevo_nombre
    db.session.commit()
    return {"msg": "Documento renombrado con éxito", "document": {"id": doc.id, "titulo": doc.titulo}}, 200


# ===================== EVIDENCIAS =====================

@docs_bp.post("/<int:doc_id>/evidences")
@jwt_required()
def upload_evidence(doc_id: int):
    """
    Sube 1 archivo de evidencia y lo asocia al documento.
    """
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

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
    """
    Lista evidencias asociadas a un documento del usuario.
    """
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc or doc.deleted_at is not None:
        return {"error": "Documento no disponible"}, 404

    rows = Evidence.query.filter_by(document_id=doc.id).order_by(
        Evidence.uploaded_at.desc()).all()
    return {"items": evidences_schema.dump(rows)}, 200


# ===================== PAPELERA (Soft Delete) =====================

@docs_bp.patch("/<int:doc_id>/trash")
@jwt_required()
def move_to_trash(doc_id: int):
    """
    Envia el documento a papelera (soft delete).
    """
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc:
        return {"error": "Documento no encontrado"}, 404
    if doc.deleted_at:
        return {"msg": "Ya estaba en la papelera"}, 200

    doc.deleted_at = datetime.utcnow()
    db.session.commit()
    return {"id": doc.id, "deleted_at": doc.deleted_at.isoformat()}, 200


@docs_bp.patch("/<int:doc_id>/restore")
@jwt_required()
def restore_from_trash(doc_id: int):
    """
    Restaura un documento desde la papelera.
    """
    user_id = get_jwt_identity()
    doc = _get_owned_doc_or_404(doc_id, user_id)
    if not doc:
        return {"error": "Documento no encontrado"}, 404
    if not doc.deleted_at:
        return {"error": "El documento no está en la papelera"}, 400

    doc.deleted_at = None
    db.session.commit()
    return {"id": doc.id, "deleted_at": None}, 200


# ===================== BORRADO PERMANENTE =====================

@docs_bp.delete("/<int:doc_id>")
@jwt_required()
def delete_document(doc_id: int):
    """
    Borrado permanente (archivo + DB). Recomendado solo desde 'papelera'.
    """
    user_id = get_jwt_identity()
    from backend.services.document_service import delete_document_for_owner

    ok = delete_document_for_owner(doc_id, user_id)
    if not ok:
        return {"error": "Documento no encontrado o sin permisos"}, 404
    return {"msg": "Documento eliminado"}, 200


@docs_bp.post("/bulk-download")
@jwt_required()
def bulk_download():
    """
    Recibe: { "ids": [int, ...] }
    - Máx 4 documentos
    - Total <= 100 MB
    - Excluye README (titulo o nombre base 'readme' con cualquier extensión)
    - Omite eliminados (papelera) y valida pertenencia
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    ids = data.get("ids", [])
    if not isinstance(ids, list) or not ids:
        return {"error": "Debes enviar una lista 'ids' con al menos un id."}, 400

    # Limite de cantidad
    if len(ids) > 4:
        return {"error": "Límite de 4 archivos por descarga masiva."}, 400

    # Buscar documentos pertenecientes al usuario y no eliminados
    docs = (
        Document.query
        .filter(Document.id.in_(ids), Document.owner_id == user_id, Document.deleted_at.is_(None))
        .all()
    )
    if not docs:
        return {"error": "No se encontraron documentos válidos."}, 404

    # Excluir README (por titulo o basename del file_path)
    def is_readme(d: Document) -> bool:
        base_titulo = Path(d.titulo).stem.lower() if d.titulo else ""
        base_file = Path(d.file_path).stem.lower() if d.file_path else ""
        return base_titulo == "readme" or base_file == "readme"

    filtered = [d for d in docs if not is_readme(d)]
    skipped = [d.titulo for d in docs if d not in filtered]

    if not filtered:
        return {"error": "Todos los archivos seleccionados fueron excluidos (README)."}, 400

    # Paths absolutos y validación de existencia
    items = []
    total_size = 0
    for d in filtered:
        abs_path = (UPLOAD_DIR.parent / d.file_path).resolve()
        # seguridad: archivo debe estar dentro de /uploads
        if UPLOAD_DIR.parent.resolve() not in abs_path.parents or not abs_path.exists():
            continue
        sz = abs_path.stat().st_size
        total_size += sz
        items.append((d, abs_path, sz))

    if not items:
        return {"error": "Archivos no disponibles físicamente."}, 404

    # Límite de tamaño total: 100 MB
    MAX_TOTAL = 100 * 1024 * 1024
    if total_size > MAX_TOTAL:
        return {"error": "El tamaño total excede 100 MB."}, 413

    # Crear ZIP temporal (evitamos memory spike)
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    zip_name = f"documentos_{ts}.zip"
    tmp = tempfile.NamedTemporaryFile(
        prefix="bulk_", suffix=".zip", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()

    try:
        # Evitar colisiones de nombres dentro del zip
        used_arcnames = set()

        def unique_arcname(name: str) -> str:
            base = Path(name).name or "archivo"
            if base not in used_arcnames:
                used_arcnames.add(base)
                return base
            stem = Path(base).stem
            ext = Path(base).suffix
            i = 2
            while True:
                cand = f"{stem} ({i}){ext}"
                if cand not in used_arcnames:
                    used_arcnames.add(cand)
                    return cand
                i += 1

        with zipfile.ZipFile(tmp_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for d, abs_path, _ in items:
                arcname = unique_arcname(d.titulo or abs_path.name)
                zf.write(abs_path, arcname=arcname)

        resp = send_file(
            tmp_path,
            as_attachment=True,
            download_name=zip_name,
            mimetype="application/zip",
            max_age=0,
            conditional=False,
        )
        if skipped:
            resp.headers["X-Skipped"] = ", ".join(skipped)
        # Limpieza diferida: werkzeug copiará antes de cerrar respuesta

        @resp.call_on_close
        def _cleanup():
            try:
                tmp_path.unlink(missing_ok=True)
            except Exception:
                pass
        return resp
    except Exception as e:
        # Fallback y cleanup
        try:
            tmp_path.unlink(missing_ok=True)
        except Exception:
            pass
        return {"error": f"No se pudo generar el ZIP: {e}"}, 500
