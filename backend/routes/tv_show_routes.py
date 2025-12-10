from flask import Blueprint, request, jsonify
from services.tmdb_service import get_popular_tv_shows
from models.tv_show import TVShow

tv_bp = Blueprint('tv_show', __name__)

@tv_bp.route("/catalog", methods=["GET"])
def get_tv_show_catalog():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 30, type=int)
    sort = request.args.get('sort', 'alphabetical', type=str)

    offset = (page - 1) * limit

    tv_shows = []
    total_count = 0

    tv_shows_list = [s.to_dict() for s in tv_shows]

    return jsonify({
        "tv_shows": tv_shows_list,
        "total_count": total_count
    })

@tv_bp.route("/popular", methods=["GET"])
def get_tv_show_popular():
    page = request.args.get('page', 1, type=int)

    data = get_popular_tv_shows(page=page)

    if data and "results" in data:
        return jsonify({"tv_shows": data["results"], "total_count": None})

    return jsonify({"tv_shows": []}), 500