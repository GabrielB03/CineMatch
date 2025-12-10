from datetime import datetime

class User:
    __tablename__ = "user"

    id = None
    username = None
    email = None
    password_hash = None
    created_at = None

    ratings = None
    watchlist = None

    def __repr__(self):
        return f"<User {self.username}>"