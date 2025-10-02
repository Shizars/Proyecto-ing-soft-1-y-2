# backend/services/audit_v2_service.py
from sqlalchemy import case, func, select
from backend.models.audit_v2 import AuditV2, AuditV2Existence
from sqlalchemy import select, func
from backend.extensions import db
from backend.models.audit_v2 import (
    AuditV2,
    AuditV2Existence,
    AuditV2Updates,
)

# --------- CRUD ----------


def create(payload: dict) -> AuditV2:
    existence = payload.pop("existence", {}) or {}
    updates = payload.pop("updates", {}) or {}

    audit = AuditV2(**payload)
    db.session.add(audit)
    db.session.flush()  # para obtener audit.id

    db.session.add(AuditV2Existence(audit_id=audit.id, **existence))
    db.session.add(AuditV2Updates(audit_id=audit.id, **updates))

    db.session.commit()
    return audit


def update(audit_id: int, payload: dict) -> AuditV2:
    audit = db.session.get(AuditV2, audit_id)
    if not audit:
        from flask import abort
        abort(404, description="AuditV2 not found")

    existence = payload.pop("existence", None)
    updates = payload.pop("updates", None)

    for k, v in payload.items():
        setattr(audit, k, v)

    if existence is not None:
        if not audit.existence:
            audit.existence = AuditV2Existence(audit_id=audit.id)
        for k, v in existence.items():
            setattr(audit.existence, k, v)

    if updates is not None:
        if not audit.updates:
            audit.updates = AuditV2Updates(audit_id=audit.id)
        for k, v in updates.items():
            setattr(audit.updates, k, v)

    db.session.commit()
    return audit


def list_(programa=None, date_from=None, date_to=None):
    stmt = select(AuditV2)
    if programa:
        stmt = stmt.where(AuditV2.programa == programa)
    if date_from:
        stmt = stmt.where(AuditV2.fecha_revision >= date_from)
    if date_to:
        stmt = stmt.where(AuditV2.fecha_revision <= date_to)
    stmt = stmt.order_by(AuditV2.id.desc())
    return [r[0] for r in db.session.execute(stmt).all()]

# --------- Reportes (API 2.x con select()) ----------


def respuestas_por_programa():
    stmt = select(AuditV2.programa, func.count(AuditV2.id).label("respuestas")) \
        .group_by(AuditV2.programa)
    rows = db.session.execute(stmt).all()
    return [{"programa": prog, "respuestas": int(cnt)} for prog, cnt in rows]


def ranking_programas(promedio=True):
    agg_fn = func.avg if promedio else func.sum
    stmt = (
        select(
            AuditV2.programa,
            agg_fn(AuditV2Existence.puntaje_total).label("puntaje"),
            func.count(AuditV2.id).label("n"),
        )
        .join(AuditV2Existence, AuditV2Existence.audit_id == AuditV2.id)
        .group_by(AuditV2.programa)
        .order_by(agg_fn(AuditV2Existence.puntaje_total).desc())
    )
    rows = db.session.execute(stmt).all()
    return [{"programa": r[0], "puntaje": float(r[1] or 0), "n": int(r[2])} for r in rows]


def existencia_global():
    items = [
        AuditV2Existence.orden_ingreso,
        AuditV2Existence.informe_derivacion,
        AuditV2Existence.cert_nacimiento,
        AuditV2Existence.carta_compromiso,
        AuditV2Existence.ficha_ingreso,
        AuditV2Existence.registro_actividades,
    ]

    # --------- Totales globales ---------
    existente_case = [case((col == "SI", 1), else_=0) for col in items]
    inexistente_case = [case((col == "NO", 1), else_=0) for col in items]

    q_global = select(
        func.sum(sum(existente_case)).label("existentes"),
        func.sum(sum(inexistente_case)).label("inexistentes"),
    )
    total_global = db.session.execute(q_global).first()

    global_data = {
        "existentes": int(total_global.existentes or 0),
        "inexistentes": int(total_global.inexistentes or 0),
    }

    # --------- Totales por programa ---------
    q_programa = (
        select(
            AuditV2.programa,
            func.sum(sum(existente_case)).label("existentes"),
            func.sum(sum(inexistente_case)).label("inexistentes"),
        )
        .join(AuditV2Existence, AuditV2Existence.audit_id == AuditV2.id)
        .group_by(AuditV2.programa)
    )
    rows = db.session.execute(q_programa).all()

    por_programa = [
        {
            "programa": r.programa,
            "existentes": int(r.existentes or 0),
            "inexistentes": int(r.inexistentes or 0),
        }
        for r in rows
    ]

    return {"global": global_data, "por_programa": por_programa}


def prt_resumen():
    def count(colname: str):
        col = getattr(AuditV2Updates, colname)
        stmt = select(col, func.count().label("c")).group_by(col)
        return {str(k): int(v) for k, v in db.session.execute(stmt).all()}

    return {
        "pii_actualizado": count("pii_actualizado"),
        "reg_act_actualizado": count("reg_act_actualizado"),
        "tribunal_actualizado": count("tribunal_actualizado"),
    }
