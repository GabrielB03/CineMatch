from flask import Blueprint, jsonify

debug_bp = Blueprint("debug", __name__, url_prefix="/debug")

@debug_bp.route("/database-info", methods=["GET"])
def db_info():
    return jsonify(
        {
            "users": 0,
            "movies": 0,
            "ratings": 0,
        }
    )