from flask import Blueprint
from .auth_routes import auth_bp
from .movie_routes import movie_bp
from .rating_routes import rating_bp
from .recommendation_routes import rec_bp
from .genre_routes import genre_bp
from .stats_routes import stats_bp
from .watchlist_routes import watchlist_bp
from .debug_routes import debug_bp
from .user_routes import user_bp

def register_routes(app):
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(movie_bp)
    app.register_blueprint(rating_bp)
    app.register_blueprint(rec_bp)
    app.register_blueprint(genre_bp, url_prefix='/genres')
    app.register_blueprint(stats_bp)
    app.register_blueprint(watchlist_bp)
    app.register_blueprint(debug_bp)
    app.register_blueprint(user_bp)