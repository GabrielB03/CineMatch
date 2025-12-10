from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.movie import Movie
from models.tv_show import TVShow
from models.rating import Rating
from services.tmdb_service import get_movie_details, get_tv_show_details
from datetime import datetime
from config import Config
from sqlalchemy.exc import IntegrityError

rating_bp = Blueprint("ratings", __name__)

def get_content_model_and_details(content_type, tmdb_id):
    if content_type == 'movie':
        Model = Movie
        detail_func = get_movie_details
        id_field = 'movie_id'
    elif content_type == 'tv':
        Model = TVShow
        detail_func = get_tv_show_details
        id_field = 'tv_show_id'
    else:
        raise ValueError("Tipo de conteúdo inválido.")

    content = Model.query.filter_by(tmdb_id=tmdb_id).first()

    if not content:
        content_data = detail_func(tmdb_id)
        if not content_data:
            return None, None, None

        content = Model(**content_data)
        db.session.add(content)
        db.session.commit()

    return Model, content, id_field

@rating_bp.route("/<string:content_type>/<int:tmdb_id>/rate", methods=["POST"])
@jwt_required()
def rate_content(content_type, tmdb_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        rating_value = float(data.get("rating", 0))

        if 1 <= rating_value <= 5:
            rating_value *= 2
        elif not (1 <= rating_value <= 10):
            return jsonify({"error": "Avaliação deve estar entre 1 e 10"}), 400

        Model, content_obj, id_field = get_content_model_and_details(
            content_type, tmdb_id)

        if not content_obj:
            return jsonify({"error": f"{content_type.capitalize()} não encontrado"}), 404

        if content_type == 'movie':
            existing = Rating.query.filter(
                Rating.user_id == user_id,
                Rating.movie_id == content_obj.id,
                Rating.tv_show_id.is_(None)
            ).first()
        else:
            existing = Rating.query.filter(
                Rating.user_id == user_id,
                Rating.tv_show_id == content_obj.id,
                Rating.movie_id.is_(None)
            ).first()

        if existing:
            existing.rating = rating_value
            existing.updated_at = datetime.utcnow()
            message = "Avaliação atualizada com sucesso!"
        else:
            new_rating = Rating(
                user_id=user_id,
                rating=rating_value,
            )
            setattr(new_rating, id_field, content_obj.id)

            db.session.add(new_rating)
            message = "Avaliação registrada com sucesso!"

        db.session.commit()
        return jsonify({"message": message}), 200

    except ValueError:
        return jsonify({"error": "Tipo de conteúdo inválido."}), 400
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Avaliação já existe para este conteúdo. Use PUT para atualizar."}), 409
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao processar avaliação: {e}")
        return jsonify({"error": "Erro interno do servidor ao processar avaliação"}), 500

@rating_bp.route("/user/ratings", methods=["GET"])
@jwt_required()
def user_ratings():
    try:
        user_id = int(get_jwt_identity())

        movie_ratings = db.session.query(Rating, Movie).join(
            Movie, Rating.movie_id == Movie.id).filter(Rating.user_id == user_id, Rating.movie_id.isnot(None)).all()

        tv_show_ratings = db.session.query(Rating, TVShow).join(
            TVShow, Rating.tv_show_id == TVShow.id).filter(Rating.user_id == user_id, Rating.tv_show_id.isnot(None)).all()

        result = []

        for r, m in movie_ratings:
            result.append({
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at.isoformat(),
                "updated_at": r.updated_at.isoformat(),
                "content_type": "movie",
                "content": {
                    "id": m.id,
                    "tmdb_id": m.tmdb_id,
                    "title": m.title,
                    "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{m.poster_path}" if m.poster_path else None,
                    "overview": m.overview,
                },
            })

        for r, t in tv_show_ratings:
            result.append({
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at.isoformat(),
                "updated_at": r.updated_at.isoformat(),
                "content_type": "tv",
                "content": {
                    "id": t.id,
                    "tmdb_id": t.tmdb_id,
                    "title": t.title,
                    "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{t.poster_path}" if t.poster_path else None,
                    "overview": t.overview,
                },
            })

        result.sort(key=lambda x: x["updated_at"], reverse=True)
        return jsonify(result), 200
    except Exception as e:
        print(f"Erro ao obter avaliações do usuário: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@rating_bp.route("/ratings/<int:rating_id>", methods=["DELETE"])
@jwt_required()
def delete_rating(rating_id):
    try:
        user_id = int(get_jwt_identity())

        rating_obj = Rating.query.filter_by(
            id=rating_id, user_id=user_id).first()

        if not rating_obj:
            return jsonify({"message": "Avaliação não encontrada ou não pertence a você."}), 404

        db.session.delete(rating_obj)
        db.session.commit()

        return jsonify({"message": "Avaliação removida com sucesso!"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao deletar avaliação: {e}")
        return jsonify({"error": "Erro interno do servidor ao deletar avaliação"}), 500

@rating_bp.route("/ratings/<int:rating_id>", methods=["PUT"])
@jwt_required()
def update_rating(rating_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()

        rating_value = data.get("rating")
        comment = data.get("comment")

        rating_obj = Rating.query.filter_by(
            id=rating_id, user_id=user_id).first()

        if not rating_obj:
            return jsonify({"message": "Avaliação não encontrada ou pertence a outro usuário."}), 404

        if rating_value is not None:
            rating_value = float(rating_value)
            if 1 <= rating_value <= 10:
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
        print(f"Erro ao atualizar avaliação: {e}")
        return jsonify({"error": "Erro interno do servidor ao atualizar avaliação"}), 500


@rating_bp.route("/movies/<int:tmdb_id>/rate", methods=["POST"])
@jwt_required()
def old_rate_movie(tmdb_id):
    return rate_content('movie', tmdb_id)

@rating_bp.route("/user/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_ratings_by_id(user_id):
    try:
        movie_ratings = db.session.query(Rating, Movie).join(
            Movie, Rating.movie_id == Movie.id).filter(Rating.user_id == user_id, Rating.movie_id.isnot(None)).all()

        tv_show_ratings = db.session.query(Rating, TVShow).join(
            TVShow, Rating.tv_show_id == TVShow.id).filter(Rating.user_id == user_id, Rating.tv_show_id.isnot(None)).all()

        result = []

        for r, m in movie_ratings:
            result.append({
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "content_type": "movie",
                "content": {
                    "id": m.id,
                    "tmdb_id": m.tmdb_id,
                    "title": m.title,
                    "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{m.poster_path}" if m.poster_path else None,
                    "overview": m.overview,
                },
            })

        for r, t in tv_show_ratings:
            result.append({
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "content_type": "tv",
                "content": {
                    "id": t.id,
                    "tmdb_id": t.tmdb_id,
                    "title": t.title,
                    "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{t.poster_path}" if t.poster_path else None,
                    "overview": t.overview,
                },
            })

        result.sort(key=lambda x: x["content"].get("title", ""), reverse=False)
        return jsonify(result), 200
    except Exception as e:
        print(f"Erro ao obter avaliações de outro usuário: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500