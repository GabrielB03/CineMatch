from flask import Flask, send_from_directory, jsonify
import os
from config import Config
from extensions import db, bcrypt, jwt, cors
from routes import register_routes

def create_app():
    app = Flask(__name__, static_folder=Config.FRONTEND_PATH, static_url_path="")
    app.config.from_object(Config)
    
    # Inicializar extensões
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    
    # Registrar rotas
    register_routes(app)
    
    # Criar tabelas no banco
    with app.app_context():
        db.create_all()
        
    # Servir index.html por padrão
    @app.route("/")
    def serve_index():
        if os.path.exists(os.path.join(Config.FRONTEND_PATH, "index.html")):
            return send_from_directory(Config.FRONTEND_PATH, "index.html")
        return jsonify({"error": "index.html não encontrado."}), 404
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        host="0.0.0.0",
        port = int(os.getenv("FLASK_PORT", 5000)),
        debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    )