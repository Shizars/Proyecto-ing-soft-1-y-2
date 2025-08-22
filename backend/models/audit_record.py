from datetime import datetime
from backend.extensions import db


class AuditRecord(db.Model):
    __tablename__ = "audits"

    id = db.Column(db.Integer, primary_key=True)

    # Identificación mínima del NNA (ajustar si tienes tabla de NNA)
    # RUN, ID interno, etc.
    nna_identificador = db.Column(db.String(20), nullable=False)
    nna_nombre = db.Column(db.String(120), nullable=True)

    # AFT, PF, etc.
    programa = db.Column(db.String(50), nullable=False)
    revisor = db.Column(db.String(120), nullable=False)
    fecha_revision = db.Column(db.Date, nullable=False)

    # "vigente" | "egresado"
    condicion = db.Column(db.String(15), nullable=False)

    # Puntajes y estados calculados
    puntaje_existencia = db.Column(db.Integer, default=0, nullable=False)
    puntaje_actualizacion = db.Column(db.Integer, default=0, nullable=False)
    # Sobresaliente/Conforme/No conforme
    estado_existencia = db.Column(db.String(20))
    estado_actualizacion = db.Column(db.String(20))

    observaciones = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship(
        "AuditItem",
        back_populates="audit",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="selectin",
    )
