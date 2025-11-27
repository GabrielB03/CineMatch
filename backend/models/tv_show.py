from extensions import db

class TVShow(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tmdb_id = db.Column(db.Integer, unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    overview = db.Column(db.Text)
    genres = db.Column(db.String(255))
    first_air_date = db.Column(db.String(10))
    poster_path = db.Column(db.String(255))
    backdrop_path = db.Column(db.String(255))
    vote_average = db.Column(db.Float)
    vote_count = db.Column(db.Integer)
    number_of_seasons = db.Column(db.Integer)
    number_of_episodes = db.Column(db.Integer)
    cast = db.Column(db.Text)
    keywords = db.Column(db.Text)
    
    def to_dict(self):
        return {
            "tmdb_id": self.tmdb_id,
            "title": self.title,
        "overview": self.overview,
        "genres": self.genres,
        "release_date": self.first_air_date,
        "poster_path": self.poster_path,
        "backdrop_path": self.backdrop_path,
        "vote_average": self.vote_average,
        "vote_count": self.vote_count,
        "runtime": None,
        "director": None,
        "cast": self.cast,
        "keywords": self.keywords,
        "type": "tv"
    }
