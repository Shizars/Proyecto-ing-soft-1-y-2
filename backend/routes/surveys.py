from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from backend.schemas.survey_schema import survey_schema, surveys_schema
from backend.services.survey_service import crear_encuesta
from backend.models.survey import SatisfactionSurvey
from backend.extensions import db

surveys_bp = Blueprint("surveys", __name__, url_prefix="/api/surveys")


@surveys_bp.post("")
@jwt_required()
def crear():
    payload = request.get_json() or {}
    survey = crear_encuesta(payload)
    return survey_schema.dump(survey), 201


@surveys_bp.get("")
@jwt_required()
def listar():
    q = SatisfactionSurvey.query.order_by(SatisfactionSurvey.created_at.desc())
    return surveys_schema.dump(q.all()), 200
