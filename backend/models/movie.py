from datetime import datetime

class Movie:
    __tablename__ = "movie"

    id = None
    tmdb_id = None
    title = None
    overview = None
    genres = None
    release_date = None
    poster_path = None
    backdrop_path = None
    vote_average = None
    vote_count = None
    runtime = None
    director = None
    cast = None
    keywords = None
    popularity = None
    created_at = None

    ratings = None
    watchlist_entries = None

    def __repr__(self):
        return f"<Movie {self.title}>"