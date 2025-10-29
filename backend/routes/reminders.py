from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from backend.extensions import db
from backend.models.reminder import Reminder
from backend.schemas.reminder_schema import ReminderSchema

reminders_bp = Blueprint("reminders", __name__, url_prefix="/api/reminders")
reminder_schema = ReminderSchema()
reminders_schema = ReminderSchema(many=True)


@reminders_bp.get("/")
@jwt_required()
def list_reminders():
    user_id = get_jwt_identity()
    rows = (Reminder.query
            .filter_by(owner_id=user_id)
            .order_by(Reminder.due_at.asc())
            .all())
    return reminders_schema.dump(rows), 200


@reminders_bp.post("/")
@jwt_required()
def create_reminder():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    title = (data.get("title") or "").strip()
    due_at_str = (data.get("due_at") or "").strip()  # ISO 8601 (UTC)

    if not title:
        return {"error": "Se requiere título"}, 400
    if not due_at_str:
        return {"error": "Se requiere due_at (ISO 8601 UTC)"}, 400

    try:
        due_at = datetime.fromisoformat(due_at_str.replace("Z", "+00:00"))
    except Exception:
        return {"error": "Formato due_at inválido (usa ISO 8601 UTC)"}, 400

    r = Reminder(title=title, due_at=due_at, owner_id=user_id)
    db.session.add(r)
    db.session.commit()
    return reminder_schema.dump(r), 201


@reminders_bp.patch("/<int:reminder_id>")
@jwt_required()
def update_reminder(reminder_id: int):
    user_id = get_jwt_identity()
    r = Reminder.query.filter_by(id=reminder_id, owner_id=user_id).first()
    if not r:
        return {"error": "Recordatorio no encontrado"}, 404

    data = request.get_json() or {}
    if "title" in data:
        t = (data.get("title") or "").strip()
        if not t:
            return {"error": "Título inválido"}, 400
        r.title = t

    if "due_at" in data:
        try:
            r.due_at = datetime.fromisoformat(
                str(data["due_at"]).replace("Z", "+00:00"))
        except Exception:
            return {"error": "Formato due_at inválido"}, 400

    if "done" in data:
        r.done = bool(data["done"])

    db.session.commit()
    return reminder_schema.dump(r), 200


@reminders_bp.delete("/<int:reminder_id>")
@jwt_required()
def delete_reminder(reminder_id: int):
    user_id = get_jwt_identity()
    r = Reminder.query.filter_by(id=reminder_id, owner_id=user_id).first()
    if not r:
        return {"error": "Recordatorio no encontrado"}, 404
    db.session.delete(r)
    db.session.commit()
    return {"msg": "Recordatorio eliminado"}, 200
