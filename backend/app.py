from flask import Flask, send_from_directory
from backend.config import Config
from backend.extensions import db, ma, jwt, migrate, cors
from backend.routes import all_blueprints
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()  # lee el .env


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Inicializar extensiones
    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # CORS: permitir todas las peticiones desde cualquier origen en /api/*
    cors(app, resources={r"/api/*": {"origins": "*"}},
         supports_credentials=True)

    # Registrar blueprints
    for bp in all_blueprints:
        app.register_blueprint(bp)

    # Ruta pública para servir archivos desde /uploads
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        uploads_dir = os.path.join(app.root_path, 'uploads')
        return send_from_directory(uploads_dir, filename)

    # Mostrar todas las rutas registradas (solo para debug)
    for rule in app.url_map.iter_rules():
        print(rule)

    return app


if __name__ == "__main__":
    create_app().run(debug=True)
