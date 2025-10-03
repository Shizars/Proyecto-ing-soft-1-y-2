# routes / documents.py
from pathlib import Path
from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from backend.services.document_service import save_file, UPLOAD_DIR
from backend.schemas.document_schema import docs_schema
from flask_jwt_extended import verify_jwt_in_request
from datetime import datetime
from backend.models.shared_link import SharedLink
from flask import jsonify
from backend.extensions import db
from backend.schemas.document_comment_schema import DocumentCommentSchema
from backend.models.document_comment import DocumentComment
from backend.extensions import db


from backend.services.tag_service import (
    add_tags_to_document,
    remove_tag_from_document,
)
from backend.schemas.document_schema import doc_schema


comment_schema = DocumentCommentSchema()
comments_schema = DocumentCommentSchema(many=True)


docs_bp = Blueprint("documents", __name__, url_prefix="/api/documents")

# Extensiones permitidas para validación
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "xlsx"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@docs_bp.post("/upload")
@jwt_required()
def upload():
    """Sube un archivo y crea un registro asociado al usuario logueado."""
    if "file" not in request.files:
        return {"error": "No se envió archivo"}, 400

    file_obj = request.files["file"]

    # Validación del formato del archivo
    if not allowed_file(file_obj.filename):
        return {
            "error": "Formato de archivo no permitido. Solo PDF, DOC, DOCX y XLSX son aceptados."
        }, 400

    user_id = get_jwt_identity()
    categoria = request.form.get("categoria", "General")

    doc = save_file(file_obj, user_id, categoria)
    return {"msg": "Subido", "document": {"id": doc.id}}, 201


@docs_bp.get("/")
@jwt_required()
def listar():
    """Devuelve únicamente los documentos del usuario autenticado."""
    from backend.models.document import Document

    user_id = get_jwt_identity()
    docs = Document.query.filter_by(owner_id=user_id).all()
    return docs_schema.dump(docs), 200


@docs_bp.get("/<int:doc_id>/url")
@jwt_required()
def get_document_url(doc_id):
    from backend.models.document import Document

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
def download(doc_id):
    """Envía el archivo binario al usuario autenticado si tiene permiso."""
    from backend.models.document import Document

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


def _build_public_url(doc):
    relative = doc.file_path.replace("\\", "/")
    if relative.startswith("uploads/"):
        relative = relative[len("uploads/"):]
    return request.url_root.rstrip("/") + "/uploads/" + relative


# backend/routes/documents.py
# …
@docs_bp.get("/shared/<token>/url")                    # ⬅️ SIN @jwt_required
def obtener_url_compartida(token):
    # 1) intenta validar JWT si viene; si no, lo ignora
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        pass

    # 2) resto de la lógica
    link = SharedLink.query.filter_by(token=token).first()
    if not link:
        return {"error": "Enlace inexistente"}, 404
    if link.expires_at < datetime.utcnow():
        return {"error": "Enlace vencido"}, 410

    from backend.models.document import Document
    doc = Document.query.get(link.document_id)
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    return {"url": _build_public_url(doc)}, 200


@docs_bp.post("/<int:doc_id>/share")
@jwt_required()
def crear_link_compartido(doc_id):
    from backend.models.document import Document

    user_id = get_jwt_identity()
    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    # 1) crear registro de enlace compartido
    link = SharedLink.new(document_id=doc.id, owner_id=user_id)

    # 2) armar la URL pública que usará el frontend
    full_url = (
        request.url_root.rstrip("/") +
        f"/api/documents/shared/{link.token}/url"
    )

    # 3) devolverla con la clave **url**
    return {"url": full_url}, 201


@docs_bp.post("/<int:doc_id>/tags")
@jwt_required()
def set_tags(doc_id):
    """
    JSON esperado: {"tags": ["legal", "contrato"]}
    Crea y/o vincula etiquetas al documento.
    """
    tag_names = request.json.get("tags", [])
    doc = add_tags_to_document(doc_id, tag_names)
    return doc_schema.dump(doc), 200


@docs_bp.delete("/<int:doc_id>/tags/<int:tag_id>")
@jwt_required()
def delete_tag(doc_id, tag_id):
    """
    Desvincula una etiqueta concreta del documento.
    """
    doc = remove_tag_from_document(doc_id, tag_id)
    return doc_schema.dump(doc), 200


@docs_bp.delete("/<int:doc_id>")
@jwt_required()
def delete_document(doc_id):
    """Elimina un documento del usuario autenticado (archivo + DB)."""
    user_id = get_jwt_identity()
    from backend.services.document_service import delete_document_for_owner

    ok = delete_document_for_owner(doc_id, user_id)
    if not ok:
        return {"error": "Documento no encontrado o sin permisos"}, 404
    return {"msg": "Documento eliminado"}, 200


@docs_bp.post("/<int:doc_id>/favorite/toggle")
@jwt_required()
def toggle_favorite(doc_id):
    """Alterna favorito del documento del usuario autenticado."""
    from backend.models.document import Document

    user_id = get_jwt_identity()
    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404

    doc.is_favorite = not bool(doc.is_favorite)
    db.session.commit()
    return {"id": doc.id, "is_favorite": doc.is_favorite}, 200


@docs_bp.post("/<int:doc_id>/favorite")
@jwt_required()
def set_favorite(doc_id):
    """Set explícito: body { is_favorite: true|false }."""
    from backend.models.document import Document

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
    """Devuelve solo documentos favoritos del usuario."""
    from backend.models.document import Document

    user_id = get_jwt_identity()
    docs = Document.query.filter_by(owner_id=user_id, is_favorite=True).all()
    return docs_schema.dump(docs), 200


@docs_bp.get("/<int:doc_id>/comments")
@jwt_required()
def list_comments(doc_id):
    """Lista comentarios de un documento del usuario (o que el usuario posee)."""
    from backend.models.document import Document
    user_id = get_jwt_identity()
    doc = Document.query.filter_by(id=doc_id, owner_id=user_id).first()
    if not doc:
        return {"error": "Documento no encontrado"}, 404
    rows = (DocumentComment.query
            .filter_by(document_id=doc_id)
            .order_by(DocumentComment.created_at.desc())
            .all())
    return comments_schema.dump(rows), 200


@docs_bp.post("/<int:doc_id>/comments")
@jwt_required()
def add_comment(doc_id):
    """Crea un comentario para un documento propio."""
    from backend.models.document import Document
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
def delete_comment(comment_id):
    """Elimina un comentario si pertenece al usuario (o al dueño del documento)."""
    from backend.models.document import Document
    user_id = get_jwt_identity()

    c = DocumentComment.query.get(comment_id)
    if not c:
        return {"error": "Comentario no encontrado"}, 404

    # el autor del comentario puede borrar; también el dueño del documento
    doc = Document.query.get(c.document_id)
    if c.owner_id != user_id and doc.owner_id != user_id:
        return {"error": "Sin permisos para eliminar"}, 403

    db.session.delete(c)
    db.session.commit()
    return {"msg": "Comentario eliminado"}, 200
