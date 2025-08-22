# backend/models/survey_answer.py
from backend.extensions import db


class SurveyAnswer(db.Model):
    __tablename__ = "survey_answers"

    id = db.Column(db.Integer, primary_key=True)
    survey_id = db.Column(db.Integer, db.ForeignKey(
        "surveys.id", ondelete="CASCADE"), nullable=False)

    codigo = db.Column(db.String(6), nullable=False)   # Q1..Q7  /  OPT_A1..
    # "satisfecho"/"insatisfecho"/"si"/"no"/"otro"
    valor = db.Column(db.String(20))
    # solo para “Otro” o comentario
    texto = db.Column(db.String(255))

    survey = db.relationship("SatisfactionSurvey", back_populates="answers")
