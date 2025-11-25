from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.movie import Movie
from models.watchlist import Watchlist
from services.tmdb_service import get_movie_details
from config import Config

watchlist_bp = Blueprint("watchlist", __name__, url_prefix="/user/watchlist")

@watchlist_bp.route("", methods=["GET"])
@jwt_required()
def get_watchlist():
    user_id = get_jwt_identity()
    limit = int(request.args.get("limit", 30))
    page = int(request.args.get("page", 1))
    offset = (page - 1) * limit

    try:
        query = db.session.query(Watchlist, Movie).join(Movie).filter(
            Watchlist.user_id == user_id
        ).order_by(Watchlist.added_at.desc())

        total_count = query.count()

        items = query.limit(limit).offset(offset).all()

        result = [
            {
                "id": w.id,
                "notes": w.notes,
                "priority": w.priority,
                "movie": {
                    "id": m.id,
                    "tmdb_id": m.tmdb_id,
                    "title": m.title,
                    "overview": m.overview,
                    "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{m.poster_path}" if m.poster_path else None,
                }
            }
            for w, m in items
        ]

        return jsonify({"wishlist": result, "total_count": total_count}), 200
    except Exception as e:
        print(f"❌ Erro ao processar GET Wishlist: {e}")
        return jsonify({"message": "Erro interno do servidor ao processar Wishlist"}), 500

@watchlist_bp.route("/add/<int:tmdb_id>", methods=["POST"])
@jwt_required()
def add_to_watchlist(tmdb_id):
    user_id = get_jwt_identity()

    try:
        movie = Movie.query.filter_by(tmdb_id=tmdb_id).first()
        if not movie:
            movie_data = get_movie_details(tmdb_id)
            if not movie_data:
                return jsonify({"message": "Filme não encontrado no TMDB."}), 404

            movie = Movie(**movie_data)
            db.session.add(movie)
            db.session.commit()

        existing_item = Watchlist.query.filter_by(
            user_id=user_id, movie_id=movie.id).first()
        if existing_item:
            return jsonify({"message": "Filme já está na sua Wishlist."}), 200

        new_item = Watchlist(user_id=user_id, movie_id=movie.id)
        db.session.add(new_item)
        db.session.commit()

        return jsonify({"message": "Filme adicionado à Wishlist com sucesso!"}), 201

    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro ao processar POST Wishlist: {e}")
        return jsonify({"message": "Erro interno do servidor ao adicionar filme"}), 500

@watchlist_bp.route("/<int:tmdb_id>", methods=["DELETE"])
@jwt_required()
def remove_from_watchlist(tmdb_id):
    user_id = get_jwt_identity()

    try:
        movie = Movie.query.filter_by(tmdb_id=tmdb_id).first()
        if not movie:
            return jsonify({"message": "Filme não encontrado."}), 404

        item = Watchlist.query.filter_by(
            user_id=user_id, movie_id=movie.id).first()
        if not item:
            return jsonify({"message": "Item não encontrado na sua Wishlist."}), 404

        db.session.delete(item)
        db.session.commit()

        return jsonify({"message": "Filme removido da Wishlist com sucesso!"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro ao processar DELETE Wishlist: {e}")
        return jsonify({"message": "Erro interno do servidor ao remover filme"}), 500