from backend.extensions import ma
from marshmallow import fields
from backend.models.survey import SatisfactionSurvey
from backend.models.survey_answer import SurveyAnswer


class SurveyAnswerSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = SurveyAnswer
        load_instance = True
        include_fk = True


class SurveySchema(ma.SQLAlchemyAutoSchema):
    answers = fields.List(fields.Nested(SurveyAnswerSchema))

    class Meta:
        model = SatisfactionSurvey
        load_instance = True
        include_fk = True


survey_schema = SurveySchema()
surveys_schema = SurveySchema(many=True)
