# Facilita importação dos serviços
from .tmdb_service import (
    fetch_tmdb_data,
    get_movie_details,
    search_movies_tmdb,
    get_popular_movies,
    get_movies_by_genre,
    get_popular_tv_shows,
    get_tv_show_details,
    get_tv_shows_by_genre
)
from .recommendation_engine import RecommendationEngine

__all__ = [
    "fetch_tmdb_data",
    "get_movie_details",
    "search_movies_tmdb",
    "get_popular_movies",
    "get_movies_by_genre",
    "get_popular_tv_shows",
    "get_tv_show_details",
    "get_tv_shows_by_genre",
    "RecommendationEngine"
]