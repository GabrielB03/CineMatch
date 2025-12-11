from extensions import db
from datetime import datetime

class Movie(db.Model):
    __tablename__ = "movie"

    id = db.Column(db.Integer, primary_key=True)
    tmdb_id = db.Column(db.Integer, unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    overview = db.Column(db.Text)
    genres = db.Column(db.String(255))
    release_date = db.Column(db.String(10))
    poster_path = db.Column(db.String(255))
    backdrop_path = db.Column(db.String(255))
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Integer)
    runtime = db.Column(db.Integer)
    director = db.Column(db.String(255))
    cast = db.Column(db.Text)
    keywords = db.Column(db.Text)
    popularity = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    ratings = db.relationship("Rating", backref="movie", lazy=True)
    watchlist_entries = db.relationship(
        "Watchlist", backref="movie", lazy=True)

    def __repr__(self):
        return f"<Movie {self.title}>"