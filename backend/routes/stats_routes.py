from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Rating, Movie
from config import Config

stats_bp = Blueprint("stats", __name__, url_prefix="/user")

@stats_bp.route("/stats", methods=["GET"])
@jwt_required()
def user_stats():
    user_id = get_jwt_identity()
    
    total = Rating.query.filter_by(user_id=user_id).count()
    avg = db.session.query(db.func.avg(Rating.rating)).filter_by(user_id=user_id).scalar() or 0
    
    top_movies = (
        db.session.query(Rating, Movie)
        .join(Movie)
        .filter(Rating.user_id == user_id)
        .order_by(Rating.rating.desc())
        .limit(5)
        .all()
    )
    
    return jsonify(
        {
            "total_ratings": total,
            "average_rating": round(float(avg), 2),
            "top_movies": [
                {"title": m.title, "rating": r.rating, "poster_path": f"{Config.TMDB_IMAGE_BASE_URL}{m.poster_path}"}
                for r, m in top_movies
            ],
        }
    )