from datetime import datetime
from extensions import db

class Movie(db.Model):
    __tablename__ = "movie"

    id = db.Column(db.Integer, primary_key=True)
    tmdb_id = db.Column(db.Integer, unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    overview = db.Column(db.Text)
    # Armazenar como string separada por vírgulas
    genres = db.Column(db.String(500))
    release_date = db.Column(db.String(20))
    poster_path = db.Column(db.String(200))
    backdrop_path = db.Column(db.String(200))
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Integer)
    runtime = db.Column(db.Integer)
    director = db.Column(db.String(100))
    cast = db.Column(db.String(1000))  # Top 5 atores principais
    keywords = db.Column(db.String(1000))  # Para filtragem baseada em conteúdo
    popularity = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relacionamentos
    ratings = db.relationship(
        "Rating", backref="movie", lazy=True, cascade="all, delete-orphan"
    )
    watchlist_entries = db.relationship(
        "Watchlist", backref="movie", lazy=True
    )

    def __repr__(self):
        return f"<Movie {self.title}>"