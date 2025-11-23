from flask import Blueprint, jsonify
from services.tmdb_service import fetch_tmdb_data

genre_bp = Blueprint("genres", __name__)

@genre_bp.route("/", methods=["GET"])
def get_genres():
    try:
        data = fetch_tmdb_data("genre/movie/list")
        return jsonify(data), 200
    except Exception as e:
        print(f"❌ Erro ao obter gêneros: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500