from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models.satisfaction import SatisfactionSurvey
from backend.schemas.satisfaction_schema import SatisfactionSurveySchema
from sqlalchemy import text
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


@bp.get("/reports/overall")
def report_overall():
    """
    Porcentaje de NNA satisfechos/insatisfechos.
    Regla: se considera 'satisfecho' si puntaje_satisfaccion >= threshold (default=4 de 6).
    Puedes cambiar el umbral con ?threshold=5 o ?threshold=3.
    """
    try:
        thr = int(request.args.get("threshold", 4))
    except ValueError:
        thr = 4

    sql = text("""
        SELECT
            SUM(
              CASE WHEN (
                (CASE WHEN lower(p1_trato)            LIKE 'satis%' THEN 1 ELSE 0 END) +
                (CASE WHEN lower(p2_info)             LIKE 'satis%' THEN 1 ELSE 0 END) +
                (CASE WHEN lower(p3_tiempo)           LIKE 'satis%' THEN 1 ELSE 0 END) +
                (CASE WHEN lower(p4_participacion)    LIKE 'satis%' THEN 1 ELSE 0 END) +
                (CASE WHEN lower(p5_resultados)       LIKE 'satis%' THEN 1 ELSE 0 END) +
                (CASE WHEN lower(p6_infraestructura)  LIKE 'satis%' THEN 1 ELSE 0 END)
              ) >= :thr THEN 1 ELSE 0 END
            ) AS satisfechos,
            COUNT(*) AS total
        FROM satisfaction_surveys
    """)
    r = db.session.execute(sql, {"thr": thr}).first()
    satisfechos = int(r[0] or 0)
    total = int(r[1] or 0)
    insatisfechos = max(total - satisfechos, 0)

    pct_satis = (satisfechos / total * 100) if total else 0.0
    pct_insat = (insatisfechos / total * 100) if total else 0.0

    return {
        "total": total,
        "satisfechos": satisfechos,
        "insatisfechos": insatisfechos,
        "pct_satis": round(pct_satis, 1),
        "pct_insatisfechos": round(pct_insat, 1),
        "threshold": thr
    }


@bp.get("/reports/by-program-satisfaction")
def report_by_program_satisfaction():
    """
    Retorna, por programa:
      - total encuestas
      - satisfechos (según umbral)
      - % satisfechos
    Regla (threshold): se considera satisfecho si puntaje_satisfaccion >= threshold (default=4 de 6).
    Query params opcionales:
      - threshold (int)
      - min_n (int) -> filtra programas con al menos N encuestas (default 1)
    """
    try:
        thr = int(request.args.get("threshold", 4))
    except ValueError:
        thr = 4
    try:
        min_n = int(request.args.get("min_n", 1))
    except ValueError:
        min_n = 1

    sql = text("""
        SELECT
          programa,
          COUNT(*) AS total,
          SUM(
            CASE WHEN (
              (CASE WHEN lower(p1_trato)           LIKE 'satis%' THEN 1 ELSE 0 END) +
              (CASE WHEN lower(p2_info)            LIKE 'satis%' THEN 1 ELSE 0 END) +
              (CASE WHEN lower(p3_tiempo)          LIKE 'satis%' THEN 1 ELSE 0 END) +
              (CASE WHEN lower(p4_participacion)   LIKE 'satis%' THEN 1 ELSE 0 END) +
              (CASE WHEN lower(p5_resultados)      LIKE 'satis%' THEN 1 ELSE 0 END) +
              (CASE WHEN lower(p6_infraestructura) LIKE 'satis%' THEN 1 ELSE 0 END)
            ) >= :thr THEN 1 ELSE 0 END
          ) AS satisfechos
        FROM satisfaction_surveys
        GROUP BY programa
    """)
    rows = db.session.execute(sql, {"thr": thr}).fetchall()

    out = []
    for programa, total, satisfechos in rows:
        total = int(total or 0)
        satisfechos = int(satisfechos or 0)
        if total < min_n:
            continue
        pct = round((satisfechos / total * 100) if total else 0.0, 1)
        out.append({
            "programa": programa or "—",
            "total": total,
            "satisfechos": satisfechos,
            "pct_satisfechos": pct,
            "threshold": thr,
        })

    # orden por % desc por defecto
    out.sort(key=lambda x: x["pct_satisfechos"], reverse=True)
    return out
