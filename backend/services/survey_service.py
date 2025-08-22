from datetime import date
from backend.extensions import db
from backend.models.survey import SatisfactionSurvey
from backend.models.survey_answer import SurveyAnswer


def _score_ans(ans: SurveyAnswer) -> int:
    if ans.codigo in {"Q1", "Q2", "Q3", "Q4", "Q5", "Q6"}:
        return 2 if ans.valor == "satisfecho" else 0
    if ans.codigo == "Q7":
        return 2 if ans.valor == "si" else 0
    return 0


def _categoria(total: int) -> str:
    return "Satisfecho" if total >= 10 else "Insatisfecho"


def _parse_date(val):
    return date.fromisoformat(val) if isinstance(val, str) else val


def crear_encuesta(data: dict):
    items = data.pop("answers", [])
    data["fecha_aplicacion"] = _parse_date(data["fecha_aplicacion"])
    survey = SatisfactionSurvey(**data)

    for it in items:
        survey.answers.append(SurveyAnswer(**it))

    total = sum(_score_ans(a) for a in survey.answers)
    survey.puntaje_total = total
    survey.categoria_final = _categoria(total)

    db.session.add(survey)
    db.session.commit()
    return survey
