# backend/models/audit_v2.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, Text, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.extensions import db

# SI / NO / No Corresponde
Estado3 = Enum('SI', 'NO', 'NC', name='aud_v2_estado3')
Cumple2 = Enum('CUMPLE', 'NO_CUMPLE', name='aud_v2_cumple2')
SiNo = Enum('SI', 'NO', name='aud_v2_sino')


class AuditV2(db.Model):
    __tablename__ = 'audits_v2'
    id = Column(Integer, primary_key=True)

    # Antecedentes (según Google Form)
    programa = Column(String(100), nullable=False)
    nombre_revisor = Column(String(150), nullable=False)
    fecha_revision = Column(Date, nullable=True)
    nombre_nna = Column(String(180), nullable=True)
    fecha_ingreso = Column(Date, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    existence = relationship("AuditV2Existence", uselist=False,
                             back_populates="audit", cascade="all, delete-orphan")
    updates = relationship("AuditV2Updates", uselist=False,
                           back_populates="audit", cascade="all, delete-orphan")


class AuditV2Existence(db.Model):
    __tablename__ = 'audit_v2_existence'
    audit_id = Column(Integer, ForeignKey('audits_v2.id'), primary_key=True)

    orden_ingreso = Column(Estado3)
    informe_derivacion = Column(Estado3)
    cert_nacimiento = Column(Estado3)
    carta_compromiso = Column(Estado3)
    ficha_ingreso = Column(Estado3)
    registro_actividades = Column(Estado3)

    puntaje_total = Column(Integer, default=0)
    calificacion_existencia = Column(Cumple2)
    observaciones_existencia = Column(Text)

    audit = relationship("AuditV2", back_populates="existence")


class AuditV2Updates(db.Model):
    __tablename__ = 'audit_v2_updates'
    audit_id = Column(Integer, ForeignKey('audits_v2.id'), primary_key=True)

    # PII
    pii_fecha_elab = Column(Date)
    pii_fecha_term = Column(Date)
    pii_actualizado = Column(SiNo)

    # Registro de actividades
    reg_act_ultima_fecha = Column(Date)
    reg_act_actualizado = Column(SiNo)

    # Informe al tribunal
    tribunal_fecha_emision = Column(Date)
    tribunal_actualizado = Column(Estado3)

    calificacion_actualizacion = Column(Cumple2)
    observaciones_actualizacion = Column(Text)

    audit = relationship("AuditV2", back_populates="updates")
