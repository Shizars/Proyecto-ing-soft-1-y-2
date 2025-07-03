# tests/test_auth_reset.py
# -*- coding: utf-8 -*-
"""
Prueba: /auth/reset-password debe rechazar un token expirado.
"""

import time
import pytest
from backend.routes.auth import serializer
from backend.models.user import User


# ───────────────────────────────── helpers ──────────────────────────────────
def generate_expired_token(email: str, monkeypatch: pytest.MonkeyPatch) -> str:
    """Crea un token firmado 2 h atrás (más allá del max_age=3600 s)."""
    original_time = time.time
    monkeypatch.setattr(time, "time", lambda: original_time() - 7200)
    token = serializer.dumps(email, salt="password-reset-salt")
    monkeypatch.setattr(time, "time", original_time)  # restaura enseguida
    return token


# ─────────────────────────────────── test ───────────────────────────────────
def test_reset_password_token_expired(client, db, monkeypatch):
    # ── usuario de prueba ────────────────────────────────────────────────
    user = User(nombre_usuario="u3", email="u3@mail")
    user.set_password("x")
    db.session.add(user)
    db.session.commit()

    expired_token = generate_expired_token(user.email, monkeypatch)

    # ── petición con token vencido ───────────────────────────────────────
    res = client.post(
        "/api/auth/reset-password",
        json={"token": expired_token, "password": "New123"},
    )

    # ── verificaciones ───────────────────────────────────────────────────
    assert res.status_code == 400

    error_msg = res.get_json()["error"]          # cuerpo JSON → dict
    assert "inválido" in error_msg.lower()       # acepta “inválido o expirado”
