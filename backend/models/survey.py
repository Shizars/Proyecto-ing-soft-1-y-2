# backend/models/survey.py
from datetime import date, datetime
from backend.extensions import db


class SatisfactionSurvey(db.Model):
    __tablename__ = "surveys"

    id = db.Column(db.Integer, primary_key=True)

    sede = db.Column(db.String(20))           # Sede | Terreno
    programa = db.Column(db.String(60))
    respondido_por = db.Column(db.String(15))  # "nna" | "adulto"
    nombre_respondiente = db.Column(db.String(120))
    nombre_aplicador = db.Column(db.String(120))
    fecha_aplicacion = db.Column(db.Date, nullable=False)

    quiere_responder = db.Column(db.Boolean, nullable=False)
    motivo_no_responde = db.Column(db.Text)

    puntaje_total = db.Column(db.Integer, default=0)
    categoria_final = db.Column(db.String(15))  # Satisfecho | Insatisfecho

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    answers = db.relationship(
        "SurveyAnswer",
        back_populates="survey",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
