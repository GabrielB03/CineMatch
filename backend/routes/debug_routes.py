from flask import Blueprint, jsonify
from extensions import db
from models import User, Movie, Rating

debug_bp = Blueprint("debug", __name__, url_prefix="/debug")

@debug_bp.route("/database-info", methods=["GET"])
def db_info():
    return jsonify (
        {
            "users": User.query.count(),
            "movies": Movie.query.count(),
            "ratings": Rating.query.count(),
        }
    )