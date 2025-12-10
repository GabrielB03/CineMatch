from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.movie import Movie
from models.tv_show import TVShow
from models.watchlist import Watchlist
from services.tmdb_service import get_movie_details, get_tv_show_details
from config import Config

watchlist_bp = Blueprint("watchlist", __name__, url_prefix="/user/watchlist")

def get_content_and_id_field(content_type, tmdb_id):
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

    content = None
    if not content:
        content_data = detail_func(tmdb_id)
        if not content_data:
            return None, None, None
        content = Model(**content_data)

    return content, id_field, Model

@watchlist_bp.route("", methods=["GET"])
@jwt_required()
def get_watchlist():
    user_id = int(get_jwt_identity())
    limit = int(request.args.get("limit", 30))
    page = int(request.args.get("page", 1))
    offset = (page - 1) * limit

    try:
        all_items = []

        total_count = len(all_items)

        items = all_items[offset:offset + limit]

        result = []
        for w, content in items:
            is_movie = isinstance(content, Movie)
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

        existing_item = None

        if existing_item:
            return jsonify({"message": f"{content_type.capitalize()} já está na sua Wishlist."}), 200

        new_item = Watchlist(user_id=user_id, **{id_field: content_obj.id})

        return jsonify({"message": f"{content_type.capitalize()} adicionado à Wishlist com sucesso!"}), 201

    except ValueError:
        return jsonify({"message": "Tipo de conteúdo inválido."}), 400
    except Exception as e:
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

        item = None

        if not item:
            return jsonify({"message": "Item não encontrado na sua Wishlist."}), 404

        return jsonify({"message": f"{content_type.capitalize()} removido da Wishlist com sucesso!"}), 200

    except ValueError:
        return jsonify({"message": "Tipo de conteúdo inválido."}), 400
    except Exception as e:
        print(f"❌ Erro ao processar DELETE Wishlist: {e}")
        return jsonify({"message": "Erro interno do servidor ao remover item"}), 500