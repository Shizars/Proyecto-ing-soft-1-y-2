# backend/schemas/audit_v2_schema.py
from marshmallow import Schema, fields


def _one_of(opts):
    return lambda v: (v is None) or (v in opts)


class AuditV2ExistenceSchema(Schema):
    orden_ingreso = fields.Str(validate=_one_of(['SI', 'NO', 'NC']))
    informe_derivacion = fields.Str(validate=_one_of(['SI', 'NO', 'NC']))
    cert_nacimiento = fields.Str(validate=_one_of(['SI', 'NO', 'NC']))
    carta_compromiso = fields.Str(validate=_one_of(['SI', 'NO', 'NC']))
    ficha_ingreso = fields.Str(validate=_one_of(['SI', 'NO', 'NC']))
    registro_actividades = fields.Str(validate=_one_of(['SI', 'NO', 'NC']))

    puntaje_total = fields.Int(allow_none=True)
    calificacion_existencia = fields.Str(
        validate=_one_of(['CUMPLE', 'NO_CUMPLE']))
    observaciones_existencia = fields.Str(allow_none=True)


class AuditV2UpdatesSchema(Schema):
    pii_fecha_elab = fields.Date(allow_none=True)
    pii_fecha_term = fields.Date(allow_none=True)
    pii_actualizado = fields.Str(validate=_one_of(['SI', 'NO']))

    reg_act_ultima_fecha = fields.Date(allow_none=True)
    reg_act_actualizado = fields.Str(validate=_one_of(['SI', 'NO']))

    tribunal_fecha_emision = fields.Date(allow_none=True)
    tribunal_actualizado = fields.Str(validate=_one_of(['SI', 'NO', 'NC']))

    calificacion_actualizacion = fields.Str(
        validate=_one_of(['CUMPLE', 'NO_CUMPLE']))
    observaciones_actualizacion = fields.Str(allow_none=True)


class AuditV2Schema(Schema):
    id = fields.Int(dump_only=True)
    programa = fields.Str(required=True)
    nombre_revisor = fields.Str(required=True)
    fecha_revision = fields.Date(allow_none=True)
    nombre_nna = fields.Str(allow_none=True)
    fecha_ingreso = fields.Date(allow_none=True)

    existence = fields.Nested(AuditV2ExistenceSchema)
    updates = fields.Nested(AuditV2UpdatesSchema)


class AuditV2ListQuerySchema(Schema):
    programa = fields.Str()
    date_from = fields.Date(load_default=None)
    date_to = fields.Date(load_default=None)
