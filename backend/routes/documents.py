from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.services.document_service import save_file
from backend.schemas.document_schema import docs_schema

docs_bp = Blueprint("documents", __name__, url_prefix="/api/documentos")


@docs_bp.post("/upload")
@jwt_required()
def upload():
    if "file" not in request.files:
        return {"error": "No se envió archivo"}, 400
    file_obj = request.files["file"]
    user_id = get_jwt_identity()
    categoria = request.form.get("categoria", "General")
    doc = save_file(file_obj, user_id, categoria)
    return {"msg": "Subido", "document": {"id": doc.id}}, 201


@docs_bp.get("/")
@jwt_required()
def listar():
    # simple: devolver todos
    from backend.models.document import Document
    docs = Document.query.all()
    return docs_schema.dump(docs), 200
