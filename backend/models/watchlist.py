from datetime import datetime

class Watchlist:
    __tablename__ = "watchlist"

    id = None
    user_id = None
    movie_id = None
    tv_show_id = None
    added_at = None
    notes = None
    priority = None

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