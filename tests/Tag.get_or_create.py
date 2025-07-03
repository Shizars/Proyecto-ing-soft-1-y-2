# tests/test_tag_model.py
from backend.models.tag import Tag


def test_get_or_create_case_insensitive(db):
    t1 = Tag.get_or_create("Infancia")
    t2 = Tag.get_or_create("infancia")           # mismo nombre, distinta caja

    assert t1.id == t2.id                       # no duplica
    assert t1.nombre == "Infancia"              # conserva mayúscula original
