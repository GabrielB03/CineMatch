from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Movie, Rating
from services.tmdb_service import get_movie_details
from datetime import datetime
from config import Config

rating_bp = Blueprint("ratings", __name__)

@rating_bp.route("/movies/<int:tmdb_id>/rate", methods=["POST"])
@jwt_required()
def rate_movie(tmdb_id):
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        rating_value = float(data.get("rating", 0))
        
        if 1 <= rating_value <= 5:
            rating_value *= 2
        elif not (1 <= rating_value <= 10):
            return jsonify({"error": "Avaliação deve estar entre 1 e 10"}), 400
        
        movie = Movie.query.filter_by(tmdb_id=tmdb_id).first()
        if not movie:
            movie_data = get_movie_details(tmdb_id)
            if not movie_data:
                return jsonify({"error": "Filme não encontrado"}), 404
            movie = Movie(**movie_data)
            db.session.add(movie)
            db.session.commit()
            
            existing = Rating.query.filter_by(user_id=user_id, movie_id=movie.id).first()
            if existing:
                existing.rating = rating_value
                existing.updated_at = datetime.utcnow()
            else:
                db.session.add(Rating(user_id=user_id, movie_id=movie.id, rating=rating_value))
                
            db.session.commit()
            return jsonify({"message": "Avaliação salva com sucesso!"}), 200
    except Exception as e:
        print(f"❌ Erro ao avaliar filme: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500
    
@rating_bp.route("/user/ratings", methods=["GET"])
@jwt_required()
def user_ratings():
    try:
        user_id = get_jwt_identity()
        ratings = db.session.query(Rating, Movie).join(Movie).filter(Rating.user_id == user_id).all()
        result = [
            {
                "rating": r.rating,
                "movie": {"id": m.id, "tmdb_id": m.tmdb_id, "title": m.title},
            }
            for r, m in ratings
        ]
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Erro ao obter avaliações: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500
