from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from flask_cors import CORS
import os
import pandas as pd  # Importando pandas para leitura do Excel

# Obtém o caminho absoluto do projeto e do frontend
project_root = os.path.dirname(os.path.abspath(__file__))
frontend_path = os.path.abspath(os.path.join(project_root, "../frontend"))

# Verifica se o frontend existe
if not os.path.exists(frontend_path):
    raise FileNotFoundError(
        f"\U0001F6A8 ERRO: Pasta do frontend não encontrada em {frontend_path}")

# Caminho absoluto para o arquivo Excel de recomendações
EXCEL_FILE_PATH = r"C:\Users\Samsung\Desktop\Gabriel\backend\assets\IMDB-Movie-Database.xlsx"

# Configuração do Flask
app = Flask(__name__, static_folder=frontend_path, static_url_path="")

# Configuração do CORS
CORS(app)

# Configuração do PostgreSQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://cinematch_user:Cinematch2025@localhost/cinematch_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'supersecretkey'

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Modelo de usuário
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)

# Criar tabelas no banco de dados
with app.app_context():
    db.create_all()

# ✅ Rota para servir o index.html
@app.route("/")
def serve_index():
    return send_from_directory(frontend_path, "index.html")

# ✅ Rota para servir arquivos estáticos (CSS, JS, imagens, HTML)
@app.route("/<path:path>")
def serve_static(path):
    if os.path.exists(os.path.join(frontend_path, path)):
        return send_from_directory(frontend_path, path)
    return jsonify({"error": f"Arquivo {path} não encontrado"}), 404

# ✅ Rota para verificar quais rotas estão registradas (debug)
@app.route("/debug-routes")
def debug_routes():
    return jsonify({"routes": [str(rule) for rule in app.url_map.iter_rules()]})

# ✅ Rota para registro de usuário
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    hashed_password = bcrypt.generate_password_hash(
        data["password"]).decode("utf-8")
    new_user = User(
        username=data["username"], email=data["email"], password_hash=hashed_password) # type: ignore

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Usuário registrado com sucesso!"}), 201

# ✅ Rota para login
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data["email"]).first()

    if user and bcrypt.check_password_hash(user.password_hash, data["password"]):
        access_token = create_access_token(identity=user.id)
        return jsonify({"access_token": access_token}), 200
    return jsonify({"message": "Credenciais inválidas"}), 401

# ✅ Rota protegida para teste de autenticação
@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    return jsonify({"message": "Acesso autorizado!"}), 200

# ✅ Rota para obter recomendações de filmes do Excel
@app.route("/recommendations", methods=["GET"])
def get_recommendations():
    try:
        # Verifica se o arquivo existe
        if not os.path.exists(EXCEL_FILE_PATH):
            return jsonify({"error": "Arquivo de recomendações não encontrado"}), 404

        # Carrega os dados do Excel
        df = pd.read_excel(EXCEL_FILE_PATH)

        # Seleciona algumas colunas para exibir no frontend
        movies = df[["Title", "Genre", "IMDB Rating", "Director"]].dropna().to_dict(orient="records")

        return jsonify({"recommendations": movies}), 200
    except Exception as e:
        return jsonify({"error": f"Erro ao processar o arquivo: {str(e)}"}), 500

if __name__ == "__main__":
    print(f"🚀 Servindo arquivos do frontend em: {frontend_path}")
    app.run(debug=True, host="0.0.0.0", port=5000)