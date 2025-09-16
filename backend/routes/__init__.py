# init.py
from backend.routes.auth import auth_bp
from backend.routes.users import users_bp
from backend.routes.documents import docs_bp
from backend.routes.audits import audits_bp
from backend.routes.surveys import surveys_bp
from .audits_v2 import bp as audits_v2_bp
from .satisfaction import bp as satisfaction_bp
all_blueprints = [auth_bp, users_bp, docs_bp,
                  audits_bp, surveys_bp, audits_v2_bp, satisfaction_bp]
