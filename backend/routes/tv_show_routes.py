from flask import Blueprint, request, jsonify
from extensions import db
from services.tmdb_service import get_popular_tv_shows
from models.tv_show import TVShow
from models.rating import Rating
from config import Config

tv_bp = Blueprint('tv_show', __name__)

@tv_bp.route("/catalog", methods=["GET"])
def get_tv_show_catalog():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 30, type=int)
    sort = request.args.get('sort', 'alphabetical', type=str)

    offset = (page - 1) * limit

    if sort == "alphabetical":
        query = TVShow.query.order_by(TVShow.title.asc())
    else:
        query = TVShow.query.order_by(TVShow.vote_average.desc())

    tv_shows = query.offset(offset).limit(limit).all()
    total_count = query.count()

    tv_shows_list = []
    for show in tv_shows:
        user_rating = Rating.query.filter_by(
            tv_show_id=show.id).with_entities(Rating.rating).first()

        tv_shows_list.append({
            "id": show.id,
            "tmdb_id": show.tmdb_id,
            "title": show.title,
            "overview": show.overview,
            "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{show.poster_path}" if show.poster_path else None,
            "user_rating": user_rating[0] if user_rating else 0
        })

    return jsonify({
        "tv_shows": tv_shows_list,
        "total_count": total_count
    })

@tv_bp.route("/popular", methods=["GET"])
def get_tv_show_popular():
    page = request.args.get('page', 1, type=int)

    data = get_popular_tv_shows(page=page)

    if data and "results" in data:
        return jsonify({"tv_shows": data["results"], "total_count": data["total_results"]})

    return jsonify({"tv_shows": []}), 500