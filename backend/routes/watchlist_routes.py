from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.movie import Movie
from models.tv_show import TVShow
from models.watchlist import Watchlist
from services.tmdb_service import get_movie_details, get_tv_show_details
from config import Config
from sqlalchemy import or_

watchlist_bp = Blueprint("watchlist", __name__, url_prefix="/user/watchlist")

def get_content_and_id_field(content_type, tmdb_id):
    if content_type == 'movie':
        Model = Movie
        detail_func = get_movie_details
        id_field = 'movie_id'
        content = Model.query.filter_by(tmdb_id=tmdb_id).first()
    elif content_type == 'tv':
        Model = TVShow
        detail_func = get_tv_show_details
        id_field = 'tv_show_id'
        content = Model.query.filter_by(tmdb_id=tmdb_id).first()
    else:
        raise ValueError("Tipo de conteúdo inválido.")

    if not content:
        content_data = detail_func(tmdb_id)
        if not content_data:
            return None, None, None
        content = Model(**content_data)
        db.session.add(content)
        db.session.commit()

    return content, id_field, Model

@watchlist_bp.route("", methods=["GET"])
@jwt_required()
def get_watchlist():
    user_id = int(get_jwt_identity())
    limit = int(request.args.get("limit", 30))
    page = int(request.args.get("page", 1))
    offset = (page - 1) * limit

    try:
        watchlist_query = db.session.query(Watchlist, Movie, TVShow).outerjoin(
            Movie, Watchlist.movie_id == Movie.id).outerjoin(
            TVShow, Watchlist.tv_show_id == TVShow.id).filter(
            Watchlist.user_id == user_id
        ).order_by(Watchlist.added_at.desc())

        total_count = watchlist_query.count()

        items = watchlist_query.offset(offset).limit(limit).all()

        result = []
        for w, movie, tv_show in items:
            content = movie or tv_show
            if not content:
                continue

            is_movie = movie is not None
            result.append({
                "id": w.id,
                "notes": w.notes,
                "priority": w.priority,
                "content_type": "movie" if is_movie else "tv",
                "content": {
                    "id": content.id,
                    "tmdb_id": content.tmdb_id,
                    "title": content.title,
                    "overview": content.overview,
                    "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{content.poster_path}" if content.poster_path else None,
                }
            })

        return jsonify({"wishlist": result, "total_count": total_count}), 200
    except Exception as e:
        print(f"❌ Erro ao processar GET Wishlist: {e}")
        return jsonify({"message": "Erro interno do servidor ao processar Wishlist"}), 500

@watchlist_bp.route("/add/<int:tmdb_id>", methods=["POST"])
@jwt_required()
def add_to_watchlist(tmdb_id):
    user_id = int(get_jwt_identity())
    content_type = request.args.get("type", "movie")

    try:
        content_obj, id_field, _ = get_content_and_id_field(
            content_type, tmdb_id)

        existing_item = Watchlist.query.filter_by(
            user_id=user_id, **{id_field: content_obj.id}).first()

        if existing_item:
            return jsonify({"message": f"{content_type.capitalize()} já está na sua Wishlist."}), 200

        new_item = Watchlist(user_id=user_id, **{id_field: content_obj.id})
        db.session.add(new_item)
        db.session.commit()

        return jsonify({"message": f"{content_type.capitalize()} adicionado à Wishlist com sucesso!"}), 201

    except ValueError:
        return jsonify({"message": "Tipo de conteúdo inválido."}), 400
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro ao processar POST Wishlist: {e}")
        return jsonify({"message": "Erro interno do servidor ao adicionar conteúdo"}), 500

@watchlist_bp.route("/<int:tmdb_id>", methods=["DELETE"])
@jwt_required()
def remove_from_watchlist(tmdb_id):
    user_id = int(get_jwt_identity())
    content_type = request.args.get("type", "movie")

    try:
        content_obj, id_field, Model = get_content_and_id_field(
            content_type, tmdb_id)

        item = Watchlist.query.filter(
            Watchlist.user_id == user_id,
            or_(
                Watchlist.movie_id == content_obj.id if content_type == 'movie' else False,
                Watchlist.tv_show_id == content_obj.id if content_type == 'tv' else False
            )
        ).first()

        if not item:
            return jsonify({"message": "Item não encontrado na sua Wishlist."}), 404

        db.session.delete(item)
        db.session.commit()

        return jsonify({"message": f"{content_type.capitalize()} removido da Wishlist com sucesso!"}), 200

    except ValueError:
        return jsonify({"message": "Tipo de conteúdo inválido."}), 400
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro ao processar DELETE Wishlist: {e}")
        return jsonify({"message": "Erro interno do servidor ao remover item"}), 500