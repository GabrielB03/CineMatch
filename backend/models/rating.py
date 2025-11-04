from datetime import datetime
from extensions import db

class Rating(db.Model):
    __tablename__ = "rating"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey("movie.id"), nullable=False)
    tmdb_id = db.Column(db.Integer, nullable=False)
    rating = db.Column(db.Float, nullable=False) # 1 a 10
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Constraint única para evitar avaliações duplicadas
    __table_args__ = (db.UniqueConstraint("user_id", "movie_id"),)
    
    def __init__(self, user_id: int, movie_id: int, tmdb_id: int, rating: float):
        self.user_id = user_id
        self.movie_id = movie_id
        self.tmdb_id = tmdb_id
        self.rating = rating
    
    def __repr__(self):
        return f"<Rating user={self.user_id} movie={self.movie_id} rating={self.rating}>"