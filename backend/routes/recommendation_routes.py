from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.recommendation_engine import RecommendationEngine, NotEnoughRatingsError
from config import Config
from utils.constants import GENRE_ID_TO_NAME
from models.tv_show import TVShow
from services.tmdb_service import get_popular_tv_shows, get_tv_shows_by_genre
from models.movie import Movie

rec_bp = Blueprint("recommendations", __name__, url_prefix="/recommendations")
engine = RecommendationEngine()

def format_movie(movie):
    return {
        "id": movie.id,
        "tmdb_id": movie.tmdb_id,
        "title": movie.title,
        "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{movie.poster_path}" if movie.poster_path else None,
        "overview": movie.overview if movie.overview else None,
        "user_rating": movie.user_rating if hasattr(movie, 'user_rating') else 0,
        "watch_providers": movie.watch_providers if hasattr(movie, 'watch_providers') else None,
        "type": "movie"
    }

def format_tv_show(tv_show):
    return {
        "id": tv_show.id,
        "tmdb_id": tv_show.tmdb_id,
        "title": tv_show.title,
        "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{tv_show.poster_path}" if tv_show.poster_path else None,
        "overview": tv_show.overview if tv_show.overview else None,
        "user_rating": tv_show.user_rating if hasattr(tv_show, 'user_rating') else 0,
        "type": "tv"
    }

def format_rec(rec):
    movie = rec["movie"]
    return {
        "score": rec["score"],
        "reason": rec["reason"],
        "movie": {
            "id": movie.id,
            "tmdb_id": movie.tmdb_id,
            "title": movie.title,
            "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{movie.poster_path}" if movie.poster_path else None,
            "overview": movie.overview if movie.overview else None,
            "type": "movie"
        },
    }

def format_tv_rec(rec):
    tv_show = rec["tv_show"]
    return {
        "score": rec["score"],
        "reason": rec["reason"],
        "tv_show": {
            "id": tv_show.id,
            "tmdb_id": tv_show.tmdb_id,
            "title": tv_show.title,
            "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{tv_show.poster_path}" if tv_show.poster_path else None,
            "overview": tv_show.overview if tv_show.overview else None,
            "type": "tv"
        },
    }

@rec_bp.route("/", methods=["GET"])
@rec_bp.route("", methods=["GET"])
@jwt_required()
def get_main_recommendations():
    user_id = get_jwt_identity()

    limit_str = request.args.get("limit", 30)
    page_str = request.args.get("page", 1)

    try:
        top_n = int(limit_str)
        page = int(page_str)
        offset = (page - 1) * top_n
    except ValueError:
        return jsonify({"message": "Os parâmetros 'limit' e 'page' devem ser números inteiros."}), 400

    try:
        all_recs = engine.hybrid_recommendations(user_id)

        total_count = len(all_recs)

        start = offset
        end = offset + top_n
        recs = all_recs[start:end]

        return jsonify({"recommendations": [format_rec(r) for r in recs], "total_count": total_count}), 200

    except NotEnoughRatingsError as e:
        print(f"⚠️ Usuário {user_id} sem avaliações suficientes: {e.message}")
        return jsonify({"message": e.message}), 422

    except Exception as e:
        print(f"❌ Erro na recomendação: {e}")
        return jsonify({"message": f"Erro interno ao gerar recomendações: {e}"}), 500

@rec_bp.route("/tv", methods=["GET"])
@jwt_required()
def get_main_tv_recommendations():
    user_id = get_jwt_identity()

    limit_str = request.args.get("limit", 30)
    page_str = request.args.get("page", 1)

    try:
        top_n = int(limit_str)
        page = int(page_str)
        offset = (page - 1) * top_n
    except ValueError:
        return jsonify({"message": "Os parâmetros 'limit' e 'page' devem ser números inteiros."}), 400

    try:
        all_recs = engine.hybrid_tv_recommendations(user_id)

        total_count = len(all_recs)

        start = offset
        end = offset + top_n
        recs = all_recs[start:end]

        return jsonify({"recommendations": [format_tv_rec(r) for r in recs], "total_count": total_count}), 200

    except NotEnoughRatingsError as e:
        print(
            f"⚠️ Usuário {user_id} sem avaliações suficientes para Séries: {e.message}")
        return jsonify({"message": e.message}), 422

    except Exception as e:
        print(f"❌ Erro na recomendação de Séries: {e}")
        return jsonify({"message": f"Erro interno ao gerar recomendações de Séries: {e}"}), 500

@rec_bp.route("/popular", methods=["GET"])
def popular_movies():
    limit_str = request.args.get("limit", 30)
    page_str = request.args.get("page", 1)

    try:
        limit = int(limit_str)
        page = int(page_str)
        offset = (page - 1) * limit
    except ValueError:
        return jsonify({"message": "Os parâmetros 'limit' e 'page' devem ser números inteiros."}), 400

    try:
        result = engine.get_popular_movies(
            top_n=limit, offset=offset, include_count=True)
        movies = result["movies"]
        total_count = result["total_count"]

        formatted_movies = [format_movie(m) for m in movies]
        return jsonify({"movies": formatted_movies, "total_count": total_count}), 200

    except Exception as e:
        print(f"❌ Erro ao obter filmes populares: {e}")
        return jsonify({"message": f"Erro interno ao buscar filmes populares: {e}"}), 500

@rec_bp.route("/tv/popular", methods=["GET"])
def popular_tv_shows():
    limit_str = request.args.get("limit", 30)
    page_str = request.args.get("page", 1)

    try:
        limit = int(limit_str)
        page = int(page_str)
    except ValueError:
        return jsonify({"message": "Os parâmetros 'limit' e 'page' devem ser números inteiros."}), 400

    try:
        result = engine.get_popular_tv_shows(
            top_n=limit, offset=(page-1)*limit)
        tv_shows = result["tv_shows"]
        total_count = result["total_count"]

        formatted_tv_shows = [format_tv_show(s) for s in tv_shows]

        return jsonify({"tv_shows": formatted_tv_shows, "total_count": total_count}), 200

    except Exception as e:
        print(f"❌ Erro ao obter séries populares: {e}")
        return jsonify({"message": f"Erro interno ao buscar séries populares: {e}"}), 500

@rec_bp.route("/genre", methods=["GET"])
def get_recommendations_by_genre():
    genre_id_str = request.args.get("genre_id")
    limit_str = request.args.get("limit", 30)
    page_str = request.args.get("page", 1)

    try:
        limit = int(limit_str)
        page = int(page_str)
        genre_id = int(genre_id_str) if genre_id_str else None
        offset = (page - 1) * limit
    except ValueError:
        return jsonify({"message": "Os parâmetros 'limit' e 'genre_id' devem ser números inteiros."}), 400

    if not genre_id:
        return jsonify({"message": "O parâmetro 'genre_id' é obrigatório."}), 400

    try:
        result = engine.get_movies_by_genre(
            genre_id, top_n=limit, offset=offset, include_count=True)

        movies = result["movies"]
        total_count = result["total_count"]

        formatted_movies = [format_movie(m) for m in movies]

        return jsonify({"movies": formatted_movies, "total_count": total_count}), 200

    except Exception as e:
        print(f"❌ Erro ao buscar filmes por Gênero: {e}")
        return jsonify({"message": f"Erro interno ao buscar filmes por Gênero: {e}"}), 500

@rec_bp.route("/tv/genre", methods=["GET"])
def get_tv_recommendations_by_genre():
    genre_id_str = request.args.get("genre_id")
    limit_str = request.args.get("limit", 30)
    page_str = request.args.get("page", 1)

    try:
        limit = int(limit_str)
        page = int(page_str)
        genre_id = int(genre_id_str) if genre_id_str else None
        offset = (page - 1) * limit
    except ValueError:
        return jsonify({"message": "Os parâmetros 'limit' e 'genre_id' devem ser números inteiros."}), 400

    if not genre_id:
        return jsonify({"message": "O parâmetro 'genre_id' é obrigatório."}), 400

    try:
        result = engine.get_tv_shows_by_genre(
            genre_id, top_n=limit, offset=offset, include_count=True)

        tv_shows = result["tv_shows"]
        total_count = result["total_count"]

        formatted_tv_shows = [format_tv_show(s) for s in tv_shows]

        return jsonify({"tv_shows": formatted_tv_shows, "total_count": total_count}), 200

    except Exception as e:
        print(f"❌ Erro ao buscar Séries por Gênero: {e}")
        return jsonify({"message": f"Erro interno ao buscar Séries por Gênero: {e}"}), 500