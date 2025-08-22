# backend/services/audit_service.py
from datetime import datetime, date
from typing import Iterable
from backend.extensions import db
from backend.models.audit_record import AuditRecord
from backend.models.audit_item import AuditItem

EXI_PREFIX = "EXI_"
ACT_PREFIX = "ACT_"

# ───────── helpers de fecha ─────────


def _parse_date(val):
    """Devuelve un date o None. Acepta objetos date, ISO 'YYYY-MM-DD'
       y formatos 'DD/MM/YYYY' o 'DD-MM-YYYY'."""
    if not val:
        return None
    if isinstance(val, date):
        return val
    s = str(val).strip()
    # ISO: 2025-08-03
    try:
        return date.fromisoformat(s)
    except Exception:
        pass
    # DD/MM/YYYY o DD-MM-YYYY
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except Exception:
            continue
    raise ValueError(f"Fecha inválida: '{val}'. Use AAAA-MM-DD o DD/MM/AAAA.")


def _estado_existencia(score: int) -> str:
    if score >= 12:
        return "Sobresaliente"
    if 9 <= score <= 11:
        return "Conforme"
    return "No conforme"


def _estado_actualizacion(score: int) -> str:
    if score == 3:
        return "Sobresaliente"
    if score == 2:
        return "Conforme"
    return "No conforme"


def calcular_puntajes(audit: AuditRecord) -> None:
    exi = sum(1 for it in audit.items if it.codigo.startswith(
        EXI_PREFIX) and it.aplica and it.existe)
    act = sum(1 for it in audit.items if it.codigo.startswith(
        ACT_PREFIX) and it.aplica and it.existe)
    audit.puntaje_existencia = exi
    audit.puntaje_actualizacion = act
    audit.estado_existencia = _estado_existencia(exi)
    audit.estado_actualizacion = _estado_actualizacion(act)


def validar_reglas(audit: AuditRecord) -> None:
    if audit.condicion.lower() == "egresado":
        req = {"EXI_12": False, "EXI_13": False}
        for it in audit.items:
            if it.codigo in req and it.aplica and it.existe:
                req[it.codigo] = True
        faltan = [k for k, v in req.items() if not v]
        if faltan:
            raise ValueError(
                f"Para egresado faltan documentos obligatorios: {', '.join(faltan)}")


def _normalizar_payload(data: dict) -> tuple[dict, Iterable[dict]]:
    """Normaliza fechas y devuelve (campos_audit, items)."""
    items_data = data.pop("items", [])
    # fecha_revision
    if "fecha_revision" in data:
        data["fecha_revision"] = _parse_date(data["fecha_revision"])
    else:
        raise ValueError("El campo 'fecha_revision' es obligatorio.")
    # items -> parse fecha individual
    norm_items = []
    for it in items_data:
        it = dict(it)
        it["fecha"] = _parse_date(it.get("fecha"))
        norm_items.append(it)
    return data, norm_items


def crear_auditoria(data: dict) -> AuditRecord:
    data, items_data = _normalizar_payload(dict(data))
    audit = AuditRecord(**data)
    for it in items_data:
        audit.items.append(AuditItem(**it))
    calcular_puntajes(audit)
    validar_reglas(audit)
    db.session.add(audit)
    db.session.commit()
    return audit


def actualizar_auditoria(audit: AuditRecord, data: dict) -> AuditRecord:
    data, items_data = _normalizar_payload(dict(data)) if data else ({}, None)

    for k, v in data.items():
        setattr(audit, k, v)

    if items_data is not None:
        audit.items.clear()
        for it in items_data:
            audit.items.append(AuditItem(**it))

    calcular_puntajes(audit)
    validar_reglas(audit)
    db.session.commit()
    return audit
