from flask import Blueprint, request, jsonify, Response
from backend.schemas.audit_v2_schema import AuditV2Schema, AuditV2ListQuerySchema
# ⚠️ Import directo del módulo, no "from backend.services import ..."
from backend.services.audit_v2_service import (
    create, update, list_,
    respuestas_por_programa, ranking_programas,
    existencia_global, prt_resumen
)
from backend.extensions import db

bp = Blueprint('audits_v2', __name__, url_prefix='/api/v2')


@bp.post('/audits')
def create_route():
    data = request.get_json()
    audit = create(AuditV2Schema().load(data))
    return AuditV2Schema().dump(audit), 201


@bp.put('/audits/<int:audit_id>')
def update_route(audit_id):
    data = request.get_json()
    audit = update(audit_id, AuditV2Schema(partial=True).load(data))
    return AuditV2Schema().dump(audit)


@bp.get('/audits')
def list_route():
    q = AuditV2ListQuerySchema().load(request.args)
    rows = list_(q.get('programa'), q.get('date_from'), q.get('date_to'))
    return jsonify(AuditV2Schema(many=True).dump(rows))

# ---- Reportes ----


@bp.get('/reports/respuestas-por-programa')
def r_respuestas():
    return jsonify(respuestas_por_programa())


@bp.get('/reports/ranking-programas')
def r_ranking():
    promedio = request.args.get('promedio', 'true').lower() != 'false'
    return jsonify(ranking_programas(promedio=promedio))


@bp.get('/reports/existencia-global')
def r_existencia_global():
    return jsonify(existencia_global())


@bp.get('/reports/pii-registro-tribunal')
def r_prt():
    return jsonify(prt_resumen())

# ---- Export CSV ----


@bp.get('/exports/audits.csv')
def export_csv():
    """
    Exporta auditorías v2 en CSV.
    Filtros opcionales:
      - programa=PEE
      - date_from=YYYY-MM-DD  (filtra por a.fecha_revision >=)
      - date_to=YYYY-MM-DD    (filtra por a.fecha_revision <=)
    """
    from datetime import date

    def _parse_date(s):
        if not s:
            return None
        try:
            return date.fromisoformat(s)
        except:
            return None

    programa = request.args.get("programa")
    df = _parse_date(request.args.get("date_from"))
    dt = _parse_date(request.args.get("date_to"))

    where = []
    params = {}
    if programa:
        where.append("a.programa = :programa")
        params["programa"] = programa
    if df:
        where.append("a.fecha_revision >= :df")
        params["df"] = df
    if dt:
        where.append("a.fecha_revision <= :dt")
        params["dt"] = dt

    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    sql = f"""
        SELECT a.id as audit_id, a.programa, a.nombre_revisor, a.fecha_revision,
               a.nombre_nna, a.fecha_ingreso,
               e.orden_ingreso, e.informe_derivacion, e.cert_nacimiento, e.carta_compromiso,
               e.ficha_ingreso, e.registro_actividades, e.puntaje_total, e.calificacion_existencia, e.observaciones_existencia,
               u.pii_fecha_elab, u.pii_fecha_term, u.pii_actualizado,
               u.reg_act_ultima_fecha, u.reg_act_actualizado,
               u.tribunal_fecha_emision, u.tribunal_actualizado, u.calificacion_actualizacion, u.observaciones_actualizacion
        FROM audits_v2 a
        LEFT JOIN audit_v2_existence e ON e.audit_id = a.id
        LEFT JOIN audit_v2_updates   u ON u.audit_id = a.id
        {where_sql}
        ORDER BY a.id DESC
    """
    result = db.session.execute(sql, params)
    cols = result.keys()
    rows = result.fetchall()

    def _stream():
        yield ",".join(cols) + "\n"
        for r in rows:
            yield ",".join("" if v is None else
                           ('"'+str(v).replace('"', '""')+'"' if ("," in str(v)
                            or "\n" in str(v) or '"' in str(v)) else str(v))
                           for v in r) + "\n"
    return Response(_stream(), mimetype='text/csv')
