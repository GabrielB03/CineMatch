from extensions import db
from datetime import datetime

class Rating(db.Model):
    __tablename__ = "rating"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey("movie.id"), nullable=True)
    tv_show_id = db.Column(
        db.Integer, db.ForeignKey("tv_show.id"), nullable=True)
    rating = db.Column(db.Float, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, user_id: int, rating: float, movie_id: int = None, tv_show_id: int = None, comment: str = None, **kwargs):
        self.user_id = user_id
        self.movie_id = movie_id
        self.tv_show_id = tv_show_id
        self.rating = rating
        self.comment = comment

    def __repr__(self):
        content_id = self.movie_id if self.movie_id else self.tv_show_id
        content_type = "movie" if self.movie_id else "tv_show"
        return f"<Rating user={self.user_id} {content_type}={content_id} rating={self.rating}>"