from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.audit_record import AuditRecord
from backend.schemas.audit_schema import audit_schema, audits_schema
from backend.services.audit_service import crear_auditoria, actualizar_auditoria

audits_bp = Blueprint("audits", __name__, url_prefix="/api/audits")


@audits_bp.post("/")
@audits_bp.post("")
@jwt_required()
def crear():
    payload = request.get_json() or {}
    try:
        audit = crear_auditoria(payload)
        return audit_schema.dump(audit), 201
    except ValueError as e:
        db.session.rollback()
        return {"error": str(e)}, 400


@audits_bp.get("/")
@jwt_required()
def listar():
    """Filtros opcionales: nna_identificador, programa, condicion."""
    q = AuditRecord.query
    if (nid := request.args.get("nna_identificador")):
        q = q.filter(AuditRecord.nna_identificador == nid)
    if (prog := request.args.get("programa")):
        q = q.filter(AuditRecord.programa == prog)
    if (cond := request.args.get("condicion")):
        q = q.filter(AuditRecord.condicion == cond)
    audits = q.order_by(AuditRecord.fecha_revision.desc()).all()
    return audits_schema.dump(audits), 200


@audits_bp.get("/<int:audit_id>")
@jwt_required()
def obtener(audit_id):
    audit = AuditRecord.query.get_or_404(audit_id)
    return audit_schema.dump(audit), 200


@audits_bp.put("/<int:audit_id>")
@jwt_required()
def actualizar(audit_id):
    audit = AuditRecord.query.get_or_404(audit_id)
    payload = request.get_json() or {}
    try:
        audit = actualizar_auditoria(audit, payload)
        return audit_schema.dump(audit), 200
    except ValueError as e:
        return {"error": str(e)}, 400


@audits_bp.delete("/<int:audit_id>")
@jwt_required()
def eliminar(audit_id):
    audit = AuditRecord.query.get_or_404(audit_id)
    db.session.delete(audit)
    db.session.commit()
    return {"msg": "Auditoría eliminada"}, 200
