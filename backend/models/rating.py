from datetime import datetime
from extensions import db

class Rating(db.Model):
    __tablename__ = "rating"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey("movie.id"), nullable=False)
    tmdb_id = db.Column(db.Integer, nullable=False)
    rating = db.Column(db.Float, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    __table_args__ = (db.UniqueConstraint("user_id", "movie_id"),)

    def __init__(self, user_id: int, movie_id: int, tmdb_id: int, rating: float, comment: str = None):
        self.user_id = user_id
        self.movie_id = movie_id
        self.tmdb_id = tmdb_id
        self.rating = rating
        self.comment = comment

    def __repr__(self):
        return f"<Rating user={self.user_id} movie={self.movie_id} rating={self.rating}>"