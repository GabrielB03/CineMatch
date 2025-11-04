from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Watchlist, Movie, Rating
from services.tmdb_service import get_movie_details
from config import Config

watchlist_bp = Blueprint("watchlist", __name__, url_prefix="/user/watchlist")

@watchlist_bp.route("", methods=["GET"])
@jwt_required()
def get_watchlist():
    user_id = get_jwt_identity()
    items = db.session.query(Watchlist, Movie).join(Movie).filter(Watchlist.user_id == user_id).all()
    result = [
        {"id": w.id, "notes": w.notes, "priority": w.priority, "movie": {"id": m.id, "title": m.title}}
        for w, m in items
    ]
    return jsonify(result)