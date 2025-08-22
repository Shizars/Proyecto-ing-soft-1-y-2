from datetime import date
from backend.extensions import db


class AuditItem(db.Model):
    __tablename__ = "audit_items"

    id = db.Column(db.Integer, primary_key=True)
    audit_id = db.Column(db.Integer, db.ForeignKey(
        "audits.id", ondelete="CASCADE"), nullable=False)

    # p.ej. EXI_01..EXI_13, ACT_01..ACT_03
    codigo = db.Column(db.String(10), nullable=False)
    descripcion = db.Column(db.String(255))
    aplica = db.Column(db.Boolean, default=True, nullable=False)
    existe = db.Column(db.Boolean, default=False, nullable=False)

    # si aplica (p.ej. fecha PII-U o informe)
    fecha = db.Column(db.Date)
    verificador_url = db.Column(db.String(255))  # enlace/evidencia opcional

    __table_args__ = (
        db.UniqueConstraint("audit_id", "codigo",
                            name="uq_item_por_auditoria"),
    )

    audit = db.relationship("AuditRecord", back_populates="items")
