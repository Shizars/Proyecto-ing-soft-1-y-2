from backend.models.user import User


def test_check_password(db):
    u = User(nombre_usuario="u1", email="u1@mail")
    u.set_password("Secret123")
    db.session.add(u)
    db.session.commit()

    assert u.check_password("Secret123") is True
    assert u.check_password("wrong") is False
