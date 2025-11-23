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
        user_id = int(user_id)

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

        existing = Rating.query.filter_by(
            user_id=user_id, movie_id=movie.id).first()

        if existing:
            existing.rating = rating_value
            existing.updated_at = datetime.utcnow()
            message = "Avaliação atualizada com sucesso!"
        else:
            new_rating = Rating(
                user_id=user_id,
                movie_id=movie.id,
                rating=rating_value,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.session.add(new_rating)
            message = "Avaliação registrada com sucesso!"

        db.session.commit()
        return jsonify({"message": message}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor ao processar avaliação"}), 500

@rating_bp.route("/user/ratings", methods=["GET"])
@jwt_required()
def user_ratings():
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id)

        ratings = db.session.query(Rating, Movie).join(
            Movie, Rating.movie_id == Movie.id).filter(Rating.user_id == user_id).all()

        result = [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment if r.comment else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                "movie": {
                    "id": m.id if m else None,
                    "tmdb_id": m.tmdb_id if m else None,
                    "title": m.title if m else "Filme Não Encontrado",
                    "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{m.poster_path}" if m and m.poster_path else None,
                    "overview": m.overview if m and m.overview else None,
                },
            }
            for r, m in ratings
        ]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Erro interno do servidor"}), 500

@rating_bp.route("/user/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_ratings_by_id(user_id):
    try:
        ratings = db.session.query(Rating, Movie).join(
            Movie, Rating.movie_id == Movie.id).filter(Rating.user_id == user_id).all()

        result = [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment if r.comment else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                "movie": {
                    "id": m.id if m else None,
                    "tmdb_id": m.tmdb_id if m else None,
                    "title": m.title if m else "Filme Não Encontrado",
                    "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{m.poster_path}" if m and m.poster_path else None,
                    "overview": m.overview if m and m.overview else None,
                },
            }
            for r, m in ratings
        ]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Erro interno do servidor"}), 500

@rating_bp.route("/ratings/<int:rating_id>", methods=["PUT"])
@jwt_required()
def update_rating(rating_id):
    try:
        user_id = get_jwt_identity()
        user_id = int(user_id)

        data = request.get_json()

        rating_value = data.get("rating")
        comment = data.get("comment")

        rating_obj = Rating.query.filter_by(
            id=rating_id, user_id=user_id).first()

        if not rating_obj:
            return jsonify({"message": "Avaliação não encontrada ou pertence a outro usuário."}), 404

        if rating_value is not None:
            rating_value = float(rating_value)
            if 1 <= rating_value <= 5:
                rating_obj.rating = rating_value * 2
            elif 1 <= rating_value <= 10:
                rating_obj.rating = rating_value
            else:
                return jsonify({"message": "Nota inválida."}), 400

        if comment is not None:
            rating_obj.comment = comment

        rating_obj.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({"message": "Avaliação e/ou comentário atualizados com sucesso!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor ao atualizar avaliação"}), 500