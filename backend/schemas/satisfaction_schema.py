# backend/schemas/satisfaction_schema.py
from backend.extensions import ma
from marshmallow import fields
from backend.models.satisfaction import SatisfactionSurvey


class SatisfactionSurveySchema(ma.SQLAlchemySchema):
    class Meta:
        model = SatisfactionSurvey
        load_instance = True

    id = ma.auto_field()
    respondida_en = ma.auto_field()
    programa = ma.auto_field()
    nombre_nna = ma.auto_field()
    responsable_aplicacion = ma.auto_field()
    fecha_aplicacion = fields.Date()  # <- antes ma.Date()

    p1_trato = ma.auto_field()
    p2_info = ma.auto_field()
    p3_tiempo = ma.auto_field()
    p4_participacion = ma.auto_field()
    p5_resultados = ma.auto_field()
    p6_infraestructura = ma.auto_field()

    observaciones = ma.auto_field()
    resultados_percibidos = ma.auto_field()
    firma_nna = ma.auto_field()
    creado_en = ma.auto_field()

    # Campo calculado/solo lectura
    puntaje_satisfaccion = fields.Integer(
        dump_only=True)  # <- antes ma.Integer()
