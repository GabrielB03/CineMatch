from datetime import datetime
from extensions import db

class Watchlist(db.Model):
    __tablename__ = "watchlist"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey("movie.id"), nullable=True)
    tv_show_id = db.Column(
        db.Integer, db.ForeignKey("tv_show.id"), nullable=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    priority = db.Column(db.Integer, default=1)

    __table_args__ = (
        db.UniqueConstraint("user_id", "movie_id",
                            name="_user_movie_watchlist_uc"),
        db.UniqueConstraint("user_id", "tv_show_id",
                            name="_user_tv_show_watchlist_uc"),
    )

    def __init__(self, user_id: int, movie_id: int = None, tv_show_id: int = None, notes: str = None, priority: int = 1):
        self.user_id = user_id
        self.movie_id = movie_id
        self.tv_show_id = tv_show_id
        self.notes = notes
        self.priority = priority

    def __repr__(self):
        content_id = self.movie_id if self.movie_id else self.tv_show_id
        content_type = "movie" if self.movie_id else "tv_show"
        return f"<Watchlist user={self.user_id} {content_type}={content_id} priority={self.priority}>"