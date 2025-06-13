from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.services.document_service import save_file
from backend.schemas.document_schema import docs_schema

docs_bp = Blueprint("documents", __name__, url_prefix="/api/documents")

# Extensiones permitidas para validación
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "xlsx"}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@docs_bp.post("/upload")
@jwt_required()
def upload():
    """Sube un archivo y crea un registro asociado al usuario logueado."""
    if "file" not in request.files:
        return {"error": "No se envió archivo"}, 400

    file_obj = request.files["file"]

    # Validación del formato del archivo
    if not allowed_file(file_obj.filename):
        return {"error": "Formato de archivo no permitido. Solo PDF, DOC, DOCX y XLSX son aceptados."}, 400

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
