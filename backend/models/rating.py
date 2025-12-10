from datetime import datetime

class Rating:
    __tablename__ = "rating"

    id = None
    user_id = None
    movie_id = None
    tv_show_id = None
    rating = None
    comment = None
    created_at = None
    updated_at = None

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