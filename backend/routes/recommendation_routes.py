from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.recommendation_engine import RecommendationEngine, NotEnoughRatingsError
from config import Config
from utils.constants import GENRE_ID_TO_NAME

rec_bp = Blueprint("recommendations", __name__, url_prefix="/recommendations")
engine = RecommendationEngine()

def format_movie(movie):
    """Formata um objeto Movie puro para ser retornado ao frontend."""
    return {
        "id": movie.id,
        "tmdb_id": movie.tmdb_id,
        "title": movie.title,
        "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{movie.poster_path}" if movie.poster_path else None,
        "overview": movie.overview if hasattr(movie, 'overview') else None, # Inclui overview
        "user_rating": movie.user_rating if hasattr(movie, 'user_rating') else 0,
        "watch_providers": movie.watch_providers if hasattr(movie, 'watch_providers') else None,
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
            "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{movie.poster_path}" if movie.poster_path else None
        },
    }
    
@rec_bp.route("/", methods=["GET"])
@rec_bp.route("", methods=["GET"])
@jwt_required()
def get_main_recommendations():
    """Função principal para obter recomendações, uso o modelo Hybrid por padrão."""
    user_id = get_jwt_identity()
    
    limit_str = request.args.get("limit", 10)
    
    try:
        # Tenta converter pra inteiro
        top_n = int(limit_str)
    except ValueError:
        # Se a conversão falhar
        return jsonify({"message": "O parâmetro 'limit' deve ser um número inteiro"}), 400
    
    try:
        recs = engine.hybrid_recommendations(user_id, top_n)
        return jsonify([format_rec(r) for r in recs]), 200
    
    except NotEnoughRatingsError as e:
        # Retorna 422 (o código que o frontend espera para acionar o fallback)
        print(f"⚠️ Usuário {user_id} sem avaliações suficientes: {e.message}")
        return jsonify({"message": e.message}), 422
    
    except Exception as e:
        # Se o motor de recomendação falhar por dados do usuário
        print(f"❌ Erro na recomendação: {e}")
        return jsonify({"message": f"Erro interno ao gerar recomendações: {e}"}), 500

@rec_bp.route("/content-based", methods=["GET"])
@jwt_required()
def content_based():
    user_id = get_jwt_identity()
    top_n = int(request.args.get("limit", 10))
    recs = engine.collaborative_filtering_recommendations(user_id, top_n)
    return jsonify([format_rec(r) for r in recs])

@rec_bp.route("/hybrid", methods=["GET"])
@jwt_required()
def hybrid():
    user_id = get_jwt_identity()
    top_n = int(request.args.get("limit", 10))
    recs = engine.hybrid_recommendations(user_id, top_n)
    return jsonify([format_rec[r] for r in recs])

@rec_bp.route("/genre", methods=["GET"])
def get_recommendations_by_genre():
    """Função pública para obter filmes baseados no ID do Gênero (ou populares se não houver ID)."""
    
    # Obtém o 'genre_id' (pode ser None)
    genre_id_str = request.args.get("genre_id")
    
    # Obtém o 'limit', com fallback para 10
    limit_str = request.args.get("limit", 10)
    
    try:
        top_n = int(limit_str)
        genre_id = int(genre_id_str) if genre_id_str else None
    except ValueError:
        return jsonify({"message": "Os parâmetros 'limit' e 'genre_id' devem ser números inteiros."}),
    
    try:
        if genre_id:
            # Busca por gênero específico
            movies = engine.get_movies_by_genre(genre_id, top_n)
        else:
            # Fallback (se genre_id for None, retorna filmes populares/gênericos)
            movies = engine.get_popular_movies(top_n)
            
        # Formata a lista de objetos Movie antes de retornar
        formatted_movies = [format_movie(m) for m in movies]
        
        # Retorna o JSON no formato {"movies": [...]}
        return jsonify({"movies": formatted_movies}), 200
    
    except Exception as e:
        print(f"❌ Erro ao buscar filmes por Gênero: {e}")
        # Retorna erro em formato JSON
        return jsonify({"message": f"Erro interno ao buscar filmes: {e}"}), 500