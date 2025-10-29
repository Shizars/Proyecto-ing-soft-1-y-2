# backend/routes/access_logs.py
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models.access_log import AccessLog
from backend.schemas.access_log_schema import access_logs_schema

access_logs_bp = Blueprint("access_logs", __name__,
                           url_prefix="/api/access-logs")


@access_logs_bp.get("/")
@jwt_required()
def list_access_logs():
    """
    Lista global de accesos (visible para cualquier usuario con sesión).
    Soporta paginación básica ?page=1&per_page=50
    """
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 25)), 1), 100)

    q = AccessLog.query.order_by(AccessLog.created_at.desc())
    rows = q.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": access_logs_schema.dump(rows.items),
        "page": page,
        "per_page": per_page,
        "total": rows.total,
        "pages": rows.pages,
    }, 200
