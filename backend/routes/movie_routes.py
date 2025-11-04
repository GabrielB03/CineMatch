from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
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
    
    # Converte a nota para inteiro para garantir a comparação
    try:
        rating = int(rating_value)
    except (TypeError, ValueError):
        # Se não for possível converter, é um dado inválido
        return jsonify({"error": "A nota de avaliação deve ser um número inteiro."}), 422
    
    # Validação: aceitar 1 a 5 estrelas (convertido para 2, 4, 6, 8, 10)
    if rating not in [2, 4, 6, 8, 10]:
        # Mensagem de erro para o frontend
        return jsonify({"error": "A avaliação deve ser um número inteiro entre 2 e 10 (múltiplo de 2)."}), 422
    
    from flask_jwt_extended import get_jwt_identity
    user_id_str = get_jwt_identity()
    
    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        return jsonify({"error": "Token de usuário inválido."}), 401
    
    if not user_id:
        return jsonify({"error": "Usuário não autenticado"}), 401
    
    try:
        # Verificar/salvar filme
        movie = Movie.query.filter_by(tmdb_id=tmdb_id).first()
        if not movie:
            movie_data = get_movie_details(tmdb_id)
            if not movie_data:
                return jsonify({"error": "Filme não encontrado."}), 404
            
            movie = Movie(**movie_data)
            db.session.add(movie)
            
        # Procurar e salvar avaliação
        existing_rating = Rating.query.filter_by(user_id=user_id, tmdb_id=tmdb_id).first()
        if existing_rating:
            existing_rating.rating = rating
        else:
            new_rating = Rating(
                user_id=user_id,
                movie_id=movie.id,
                tmdb_id=tmdb_id,
                rating = rating
            )
            db.session.add(new_rating)
            
        db.session.commit()
        
        return jsonify({"message": "✔ Avaliação salva com sucesso!"}), 200
    
    except Exception as e:
        # Em caso de erro (ex: falha no commit do DB), faça rollback e retorne 422
        db.session.rollback()
        print(f"❌ Erro de DB/Processamento na avaliação: {e}")
        # Retorna o 422 com a mensagem de erro (que o frontend deve agora ler)
        return jsonify({"error": f"Falha ao salvar a avaliação: {e}"}), 422