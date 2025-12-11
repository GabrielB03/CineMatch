from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.movie import Movie
from models.rating import Rating
from services.tmdb_service import get_movie_details, search_movies_tmdb, get_popular_movies, get_movies_by_genre
from config import Config
import traceback

movie_bp = Blueprint("movies", __name__, url_prefix="/movies")

@movie_bp.route("/by-genre/<int:genre_id>", methods=["GET"])
def movies_by_genre(genre_id):
    page = int(request.args.get("page", 1))
    results = get_movies_by_genre(genre_id, page)
    return (jsonify(results), 200) if results else (jsonify({"error": "Erro ao obter filmes por gênero"}), 500)

@movie_bp.route("/search", methods=["GET"])
def search_movies():
    query = request.args.get("q", "").strip()
    page = int(request.args.get("page", 1))

    if not query:
        return jsonify({"error": "Query obrigatória"}), 400

    results = search_movies_tmdb(query, page)
    return (jsonify(results), 200) if results else (jsonify({"error": "Erro ao buscar filmes"}), 500)


@movie_bp.route("/popular", methods=["GET"])
def popular_movies():
    page = int(request.args.get("page", 1))
    results = get_popular_movies(page)
    return (jsonify(results), 200) if results else (jsonify({"error": "Erro ao obter filmes populares"}), 500)

@movie_bp.route("/catalog", methods=["GET"])
def get_all_movies_catalog():
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 30))
        sort = request.args.get("sort", "alphabetical")

        offset = (page - 1) * limit

        if sort == "alphabetical":
            query = Movie.query.order_by(Movie.title.asc())
        else:
            query = Movie.query.order_by(Movie.popularity.desc())

        movies = query.offset(offset).limit(limit).all()
        total_count = query.count()

        formatted_movies = []
        for movie in movies:
            user_rating = Rating.query.filter_by(
                movie_id=movie.id).with_entities(Rating.rating).first()

            formatted_movies.append({
                "id": movie.id,
                "tmdb_id": movie.tmdb_id,
                "title": movie.title,
                "overview": movie.overview,
                "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{movie.poster_path}" if movie.poster_path else None,
                "user_rating": user_rating[0] if user_rating else 0
            })

        return jsonify({"movies": formatted_movies, "total_count": total_count}), 200

    except Exception as e:
        print(f"❌ Erro ao obter catálogo de filmes: {e}")
        return jsonify({"error": "Erro interno ao buscar catálogo de filmes"}), 500

@movie_bp.route("/<int:tmdb_id>/details", methods=["GET"])
def movie_details(tmdb_id):
    movie = Movie.query.filter_by(tmdb_id=tmdb_id).first()

    if not movie:
        movie_data = get_movie_details(tmdb_id)
        if not movie_data:
            return jsonify({"error": "Filme não encontrado"}), 404
        movie = Movie(**movie_data)
        db.session.add(movie)
        db.session.commit()

    return jsonify(
        {
            "id": movie.id,
            "tmdb_id": movie.tmdb_id,
            "title": movie.title,
            "overview": movie.overview,
            "genres": movie.genres.split(",") if movie.genres else [],
            "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{movie.poster_path}" if movie.poster_path else None,
        }
    )

@movie_bp.route("/<int:tmdb_id>/rate", methods=["POST"])
@jwt_required()
def rate_movie(tmdb_id):
    data = request.get_json()
    rating_value = data.get("rating")

    try:
        rating = int(rating_value)
    except (TypeError, ValueError):
        return jsonify({"error": "A nota de avaliação deve ser um número inteiro."}), 422

    if rating not in [2, 4, 6, 8, 10]:
        return jsonify({"error": "A avaliação deve ser um número inteiro entre 2 e 10 (múltiplo de 2)."}), 422

    user_id_str = get_jwt_identity()

    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        return jsonify({"error": "Token de usuário inválido."}), 401

    if not user_id:
        return jsonify({"error": "Usuário não autenticado"}), 401

    try:
        movie = Movie.query.filter_by(tmdb_id=tmdb_id).first()
        if not movie:
            movie_data = get_movie_details(tmdb_id)
            if not movie_data:
                return jsonify({"error": "Filme não encontrado."}), 404

            movie = Movie(**movie_data)
            db.session.add(movie)
            db.session.commit()

        existing_rating = Rating.query.filter_by(
            user_id=user_id, movie_id=movie.id).first()

        if existing_rating:
            existing_rating.rating = rating
        else:
            new_rating = Rating(
                user_id=user_id,
                movie_id=movie.id,
                rating=rating
            )
            db.session.add(new_rating)

        db.session.commit()

        return jsonify({"message": "✔ Avaliação salva com sucesso!"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro de DB/Processamento na avaliação: {e}")
        return jsonify({"error": f"Falha ao salvar a avaliação: {e}"}), 422