from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models.satisfaction import SatisfactionSurvey
from backend.schemas.satisfaction_schema import SatisfactionSurveySchema

bp = Blueprint("satisfaction", __name__, url_prefix="/api/satisfaction")

schema = SatisfactionSurveySchema()
list_schema = SatisfactionSurveySchema(many=True)


@bp.post("/")
def create_survey():
    data = request.get_json()
    obj = schema.load(data)
    db.session.add(obj)
    db.session.commit()
    return schema.dump(obj), 201


@bp.get("/")
def list_surveys():
    q = SatisfactionSurvey.query.order_by(SatisfactionSurvey.creado_en.desc())
    return jsonify(list_schema.dump(q.all()))

# reporte simple: conteo por programa + promedio de puntaje_satisfaccion


@bp.get("/reports/by-program")
def report_by_program():
    rows = db.session.execute("""
        SELECT programa,
               COUNT(*) as n,
               AVG(
                   (CASE WHEN lower(p1_trato) LIKE 'satis%' THEN 1 ELSE 0 END) +
                   (CASE WHEN lower(p2_info) LIKE 'satis%' THEN 1 ELSE 0 END) +
                   (CASE WHEN lower(p3_tiempo) LIKE 'satis%' THEN 1 ELSE 0 END) +
                   (CASE WHEN lower(p4_participacion) LIKE 'satis%' THEN 1 ELSE 0 END) +
                   (CASE WHEN lower(p5_resultados) LIKE 'satis%' THEN 1 ELSE 0 END) +
                   (CASE WHEN lower(p6_infraestructura) LIKE 'satis%' THEN 1 ELSE 0 END)
               ) as puntaje_promedio
        FROM satisfaction_surveys
        GROUP BY programa
        ORDER BY n DESC
    """).fetchall()
    return jsonify([
        {"programa": r[0], "n": int(
            r[1] or 0), "puntaje_promedio": float(r[2] or 0.0)}
        for r in rows
    ])
