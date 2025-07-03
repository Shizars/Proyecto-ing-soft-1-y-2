# tests/conftest.py
# -*- coding: utf-8 -*-
"""
Fixtures de PyTest para el backend.

• Agrega la carpeta raíz (la que contiene `backend/`) a sys.path
  para que los imports funcionen sin importar desde dónde ejecutemos `pytest`.
• Crea una app Flask aislada con una base SQLite temporal.
"""

import os
import sys
import tempfile
import pathlib
import pytest

# ──────────────────── asegurar ruta raíz ────────────────────────────────────
ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent  # <repo-root>
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Ahora ya podemos importar el paquete backend
from backend.app import create_app, db as _db  # noqa: E402  pylint: disable=wrong-import-position

# ───────────────────── fixtures ─────────────────────────────────────────────


@pytest.fixture(scope="session")
def flask_app():
    """Aplicación Flask aislada (DB SQLite temporal en disco)."""
    db_fd, db_path = tempfile.mkstemp()
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

    app = create_app()

    with app.app_context():
        _db.create_all()         # crea esquema
        yield app                # -- las pruebas corren aquí --
        _db.session.remove()
        _db.drop_all()

    os.close(db_fd)
    os.unlink(db_path)           # borra archivo SQLite


@pytest.fixture
def client(flask_app):
    """Cliente de pruebas para hacer requests."""
    return flask_app.test_client()


@pytest.fixture
def db(flask_app):
    """Devuelve la instancia de SQLAlchemy ya ligada a la app."""
    return _db
