from flask import Flask
from backend.config import Config
from backend.extensions import db, ma, jwt, migrate, cors
from backend.routes import all_blueprints


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # extensiones
    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    cors(app, resources={r"/api/*": {"origins": "*"}})

    # blueprints
    for bp in all_blueprints:
        app.register_blueprint(bp)

    return app


if __name__ == "__main__":
    create_app().run(debug=True)
