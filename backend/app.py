import random
import unicodedata
from googletrans import Translator
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
        f"ERRO: Pasta do frontend não encontrada em {frontend_path}")

# Caminho absoluto para o arquivo Excel de recomendações
EXCEL_FILE_PATH = os.path.join(
    project_root, "assets", "IMDB-Movie-Database.xlsx")

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
        # type: ignore
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


def remover_acentos(texto):
    """Remove acentos de uma string."""
    if isinstance(texto, str):
        return unicodedata.normalize("NFKD", texto).encode("ASCII", "ignore").decode("ASCII")
    return texto

# ✅ Rota para obter recomendações de filmes do Excel
@app.route("/recommendations", methods=["GET"])
def get_recommendations():
    try:
        if not os.path.exists(EXCEL_FILE_PATH):
            return jsonify({"error": "Arquivo de recomendações não encontrado"}), 404

        # Carrega os dados do Excel corretamente
        df = pd.read_excel(
            EXCEL_FILE_PATH, sheet_name="IMDb Movie Database", header=0)

        # Debug: Exibe as primeiras linhas no terminal
        print("🔹 Primeiras linhas do DataFrame:\n", df.head())

        # Ajusta os nomes das colunas esperadas
        expected_columns = ["Title", "Genre",
                            "IMDb Score (1-10)", "Director Name"]
        df.columns = df.columns.str.strip()  # Remove espaços extras

        # Verifica se todas as colunas esperadas estão no DataFrame
        if not all(col in df.columns for col in expected_columns):
            return jsonify({
                "error": "Colunas esperadas não encontradas no arquivo.",
                "encontradas": df.columns.tolist()
            }), 500

        # Normaliza os dados da coluna Genre
        df["Genre"] = df["Genre"].astype(str).str.lower().str.strip()

        # Obtém o gênero da requisição
        genre = request.args.get("genre", "").strip().lower()

        # Filtra os filmes pelo gênero, caso informado
        if genre:
            df = df[df["Genre"].str.contains(genre, na=False, regex=True)]

        # Seleciona colunas relevantes e retorna os dados
        if not df.empty:
            movies = df[expected_columns].dropna().to_dict(orient="records")

            # 🔹 Embaralha as recomendações e retorna no máximo 10 filmes aleatórios
            random.shuffle(movies)
            movies = movies[:10]
        else:
            movies = []

        return jsonify({"recommendations": movies}), 200
    except Exception as e:
        print(f"❌ Erro ao processar recomendações: {e}")
        return jsonify({"error": f"Erro ao processar o arquivo: {str(e)}"}), 500

if __name__ == "__main__":
    print(f"🚀 Servindo arquivos do frontend em: {frontend_path}")
    app.run(debug=True, host="0.0.0.0", port=5000)