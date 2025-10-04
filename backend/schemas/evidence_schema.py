from backend.extensions import ma
from backend.models.evidence import Evidence


class EvidenceSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Evidence
        load_instance = True
        include_fk = True


evidence_schema = EvidenceSchema()
evidences_schema = EvidenceSchema(many=True)
