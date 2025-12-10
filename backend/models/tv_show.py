class TVShow:
    id = None
    tmdb_id = None
    title = None
    overview = None
    genres = None
    first_air_date = None
    poster_path = None
    backdrop_path = None
    vote_average = None
    vote_count = None
    number_of_seasons = None
    number_of_episodes = None
    cast = None
    keywords = None

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