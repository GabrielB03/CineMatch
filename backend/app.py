from flask import Flask, send_from_directory, jsonify
import os
from config import Config
from extensions import db, bcrypt, jwt
from flask_cors import CORS
from routes.rating_routes import rating_bp
from routes.auth_routes import auth_bp
from routes.movie_routes import movie_bp
from routes.recommendation_routes import rec_bp

def create_app():
    app = Flask(__name__, static_folder=Config.FRONTEND_PATH,
                static_url_path="")
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    CORS(app, resources={
         r"/*": {"origins": [
             "http://localhost:5173",
             "http://127.0.0.1:5173",
             "https://localhost:5173",
             "https://127.0.0.1:5173"
         ]}}, supports_credentials=True)

    app.register_blueprint(rating_bp, url_prefix='/api/ratings')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(movie_bp, url_prefix='/api/movies')
    app.register_blueprint(rec_bp, url_prefix='/api/recommendations')

    with app.app_context():
        db.create_all()

    @app.route("/")
    def serve_index():
        if os.path.exists(os.path.join(Config.FRONTEND_PATH, "index.html")):
            return send_from_directory(Config.FRONTEND_PATH, "index.html")
        return jsonify({"error": "index.html não encontrado."}), 404

    return app

if __name__ == '__main__':
    app = create_app()

    FLASK_PORT = int(os.getenv("FLASK_PORT", 5000))
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False").lower() == "true"

    CERT_FILE = 'localhost+1.pem'
    KEY_FILE = 'localhost+1-key.pem'

    if os.path.exists(CERT_FILE) and os.path.exists(KEY_FILE):
        app.run(
            host="0.0.0.0",
            port=FLASK_PORT,
            debug=FLASK_DEBUG,
            ssl_context=(CERT_FILE, KEY_FILE)
        )
    else:
        print("AVISO: Arquivos SSL não encontrados (localhost+1.pem e localhost+1-key.pem). Rodando em HTTP.")
        app.run(
            host="0.0.0.0",
            port=FLASK_PORT,
            debug=FLASK_DEBUG
        )