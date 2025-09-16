from backend.extensions import db
from datetime import datetime


class SatisfactionSurvey(db.Model):
    __tablename__ = "satisfaction_surveys"

    id = db.Column(db.Integer, primary_key=True)
    respondida_en = db.Column(
        db.String(20), nullable=False)            # Sede | Terreno
    programa = db.Column(db.String(200), nullable=False)

    nombre_nna = db.Column(db.String(150))
    responsable_aplicacion = db.Column(db.String(150))
    fecha_aplicacion = db.Column(db.Date)

    # 6 respuestas: 'Satisfecho' | 'Insatisfecho'
    p1_trato = db.Column(db.String(20), nullable=False)
    p2_info = db.Column(db.String(20), nullable=False)
    p3_tiempo = db.Column(db.String(20), nullable=False)
    p4_participacion = db.Column(db.String(20), nullable=False)
    p5_resultados = db.Column(db.String(20), nullable=False)
    p6_infraestructura = db.Column(db.String(20), nullable=False)

    observaciones = db.Column(db.Text)

    # selección múltiple (guardamos como JSON)
    resultados_percibidos = db.Column(db.JSON, default=list)

    # texto; si luego firmamos con canvas -> url
    firma_nna = db.Column(db.String(200))

    creado_en = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # ayuda para reportes
    @property
    def puntaje_satisfaccion(self) -> int:
        # 1 punto por "Satisfecho", 0 por "Insatisfecho" (máx 6)
        vals = [self.p1_trato, self.p2_info, self.p3_tiempo,
                self.p4_participacion, self.p5_resultados, self.p6_infraestructura]
        return sum(1 for v in vals if (v or "").lower().startswith("satis"))
