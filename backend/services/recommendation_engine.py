import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from scipy.sparse import csr_matrix
from extensions import db
from models.movie import Movie
from models.tv_show import TVShow
from models.rating import Rating
from config import Config
from utils.constants import GENRE_ID_TO_NAME, NotEnoughRatingsError
import random

class RecommendationEngine:
    def __init__(self):
        self.content_vectorizer = TfidfVectorizer(
            max_features=5000, stop_words="english")

    def get_content_features(self, content):
        features = []

        if content.genres:
            features.extend([g.strip().replace(' ', '_') for g in content.genres.split(",")])

        if hasattr(content, 'director') and content.director:
            cast_list = content.cast.split(",")[:3]
            features.extend(
                [f"actor_{actor.strip().replace(' ', '_')}" for actor in cast_list])
        elif hasattr(content, 'cast') and content.cast:
            cast_list = content.cast.split(",")[:3]
            features.extend(
                [f"actor_{actor.strip().replace(' ', '_')}" for actor in cast_list])

        if content.keywords:
            keywords = content.keywords.split(",")[:5]
            features.extend([kw.strip().replace(" ", "_") for kw in keywords])

        date_field = getattr(content, 'release_date', getattr(content, 'first_air_date', None))

        if date_field:
            try:
                year = int(date_field[:4])
                decade = (year // 10) * 10
                features.append(f"decade_{decade}s")
            except Exception:
                pass

        return " ".join(features)

    def content_based_recommendations(self, user_id, top_n=10):
        try:
            MIN_RATINGS = Config.MINIMUM_RATINGS_FOR_PERSONALIZED

            positive_ratings_count = (
                db.session.query(Rating)
                .filter(Rating.user_id == user_id, Rating.rating >= 6.0, Rating.movie_id.isnot(None))
                .count()
            )

            if positive_ratings_count < MIN_RATINGS:
                raise NotEnoughRatingsError(
                    required_count=MIN_RATINGS,
                    current_count=positive_ratings_count,
                    message="Content-based requer um mínimo de avaliações positivas."
                )

            user_ratings = (
                db.session.query(Rating, Movie)
                .join(Movie)
                .filter(Rating.user_id == user_id, Rating.rating >= 6.0, Rating.movie_id.isnot(None))
                .all()
            )
            if not user_ratings:
                return []

            all_movies = Movie.query.all()
            if len(all_movies) < 2:
                return []

            movie_features = {}
            feature_texts = []
            movie_ids = []

            for movie in all_movies:
                features = self.get_content_features(movie)
                movie_features[movie.id] = features
                feature_texts.append(features)
                movie_ids.append(movie.id)

            if not any(feature_texts):
                return []

            tfidf_matrix = self.content_vectorizer.fit_transform(feature_texts)

            user_profile = np.zeros(tfidf_matrix.shape[1])
            total_weight = 0

            for rating, movie in user_ratings:
                movie_idx = movie_ids.index(movie.id)
                weight = rating.rating / 10.0
                user_profile += tfidf_matrix[movie_idx].toarray().ravel() * \
                    weight
                total_weight += weight

            if total_weight > 0:
                user_profile /= total_weight

            similarities = cosine_similarity(
                np.array([user_profile]), tfidf_matrix)[0]

            rated_movie_ids = {rating.movie_id for rating, _ in user_ratings}
            movie_similarities = [
                (movie_ids[i], similarities[i])
                for i in range(len(similarities))
                if movie_ids[i] not in rated_movie_ids and similarities[i] > 0
            ]
            movie_similarities.sort(key=lambda x: x[1], reverse=True)

            recommendations = []
            for movie_id, score in movie_similarities[:top_n]:
                movie = Movie.query.get(movie_id)
                if movie:
                    recommendations.append({
                        "movie": movie,
                        "score": float(score),
                        "reason": "Baseado no seu gosto por filmes similares"
                    })

            return recommendations
        except Exception as e:
            if isinstance(e, NotEnoughRatingsError):
                raise
            print(f"❌ Erro na recomendação baseada em conteúdo: {e}")
            return []
            
    def content_based_tv_recommendations(self, user_id, top_n=10):
        try:
            MIN_RATINGS = Config.MINIMUM_RATINGS_FOR_PERSONALIZED

            positive_ratings_count = (
                db.session.query(Rating)
                .filter(Rating.user_id == user_id, Rating.rating >= 6.0, Rating.tv_show_id.isnot(None))
                .count()
            )

            if positive_ratings_count < MIN_RATINGS:
                raise NotEnoughRatingsError(
                    required_count=MIN_RATINGS,
                    current_count=positive_ratings_count,
                    message="Content-based requer um mínimo de avaliações positivas para séries."
                )

            user_ratings = (
                db.session.query(Rating, TVShow)
                .join(TVShow, Rating.tv_show_id == TVShow.id)
                .filter(Rating.user_id == user_id, Rating.rating >= 6.0, Rating.tv_show_id.isnot(None))
                .all()
            )
            if not user_ratings:
                return []

            all_tv_shows = TVShow.query.all()
            if len(all_tv_shows) < 2:
                return []

            tv_show_features = {}
            feature_texts = []
            tv_show_ids = []

            for tv_show in all_tv_shows:
                features = self.get_content_features(tv_show)
                tv_show_features[tv_show.id] = features
                feature_texts.append(features)
                tv_show_ids.append(tv_show.id)

            if not any(feature_texts):
                return []

            tfidf_matrix = self.content_vectorizer.fit_transform(feature_texts)

            user_profile = np.zeros(tfidf_matrix.shape[1])
            total_weight = 0

            for rating, tv_show in user_ratings:
                tv_show_idx = tv_show_ids.index(tv_show.id)
                weight = rating.rating / 10.0
                user_profile += tfidf_matrix[tv_show_idx].toarray().ravel() * \
                    weight
                total_weight += weight

            if total_weight > 0:
                user_profile /= total_weight

            similarities = cosine_similarity(
                np.array([user_profile]), tfidf_matrix)[0]

            rated_tv_show_ids = {rating.tv_show_id for rating, _ in user_ratings}
            tv_show_similarities = [
                (tv_show_ids[i], similarities[i])
                for i in range(len(similarities))
                if tv_show_ids[i] not in rated_tv_show_ids and similarities[i] > 0
            ]
            tv_show_similarities.sort(key=lambda x: x[1], reverse=True)

            recommendations = []
            for tv_show_id, score in tv_show_similarities[:top_n]:
                tv_show = TVShow.query.get(tv_show_id)
                if tv_show:
                    recommendations.append({
                        "tv_show": tv_show,
                        "score": float(score),
                        "reason": "Baseado no seu gosto por séries similares"
                    })

            return recommendations
        except Exception as e:
            if isinstance(e, NotEnoughRatingsError):
                raise
            print(f"❌ Erro na recomendação baseada em conteúdo para séries: {e}")
            return []

    def collaborative_filtering_recommendations(self, user_id, top_n=10):
        try:
            ratings_data = db.session.query(
                Rating.user_id, Rating.movie_id, Rating.rating).filter(Rating.movie_id.isnot(None)).all()
            if len(ratings_data) < 10:
                return []

            df = pd.DataFrame(ratings_data, columns=[
                              "user_id", "movie_id", "rating"])

            df['user_id'] = df['user_id'].astype(str)
            user_id = str(user_id)

            user_movie_matrix = df.pivot_table(
                index="user_id", columns="movie_id", values="rating"
            ).fillna(0)

            if user_id not in user_movie_matrix.index:
                return []

            num_features = user_movie_matrix.shape[1]
            n_components = min(50, num_features - 1)

            if n_components < 1:
                return []

            collab_model = TruncatedSVD(
                n_components=n_components, random_state=42)

            user_movie_sparse = csr_matrix(user_movie_matrix.values)
            svd_matrix = collab_model.fit_transform(
                user_movie_sparse)
            reconstructed = collab_model.inverse_transform(
                svd_matrix)

            user_idx = list(user_movie_matrix.index).index(user_id)
            user_predictions = reconstructed[user_idx]

            user_ratings = user_movie_matrix.loc[user_id]
            unrated_movies = user_ratings[user_ratings == 0].index.tolist()

            recommendations = []
            for movie_id in unrated_movies:
                movie_idx = list(user_movie_matrix.columns).index(movie_id)
                predicted_rating = user_predictions[movie_idx]

                if predicted_rating > 6.0:
                    movie = Movie.query.get(movie_id)
                    if movie:
                        recommendations.append({
                            "movie": movie,
                            "score": float(predicted_rating),
                            "reason": "Baseado em usuários com gostos similares"
                        })

            recommendations.sort(key=lambda x: x["score"], reverse=True)
            return recommendations
        except Exception as e:
            print(f"❌ Erro na filtragem colaborativa: {e}")
            return []

    def collaborative_filtering_tv_recommendations(self, user_id, top_n=10):
        try:
            ratings_data = db.session.query(
                Rating.user_id, Rating.tv_show_id, Rating.rating).filter(Rating.tv_show_id.isnot(None)).all()
            if len(ratings_data) < 10:
                return []

            df = pd.DataFrame(ratings_data, columns=[
                              "user_id", "tv_show_id", "rating"])

            df['user_id'] = df['user_id'].astype(str)
            user_id = str(user_id)

            user_tv_matrix = df.pivot_table(
                index="user_id", columns="tv_show_id", values="rating"
            ).fillna(0)

            if user_id not in user_tv_matrix.index:
                return []

            num_features = user_tv_matrix.shape[1]
            n_components = min(50, num_features - 1)

            if n_components < 1:
                return []

            collab_model = TruncatedSVD(
                n_components=n_components, random_state=42)

            user_tv_sparse = csr_matrix(user_tv_matrix.values)
            svd_matrix = collab_model.fit_transform(
                user_tv_sparse)
            reconstructed = collab_model.inverse_transform(
                svd_matrix)

            user_idx = list(user_tv_matrix.index).index(user_id)
            user_predictions = reconstructed[user_idx]

            user_ratings = user_tv_matrix.loc[user_id]
            unrated_tv_shows = user_ratings[user_ratings == 0].index.tolist()

            recommendations = []
            for tv_show_id in unrated_tv_shows:
                tv_show_idx = list(user_tv_matrix.columns).index(tv_show_id)
                predicted_rating = user_predictions[tv_show_idx]

                if predicted_rating > 6.0:
                    tv_show = TVShow.query.get(tv_show_id)
                    if tv_show:
                        recommendations.append({
                            "tv_show": tv_show,
                            "score": float(predicted_rating),
                            "reason": "Baseado em usuários com gostos similares"
                        })

            recommendations.sort(key=lambda x: x["score"], reverse=True)
            return recommendations
        except Exception as e:
            print(f"❌ Erro na filtragem colaborativa para séries: {e}")
            return []

    def hybrid_recommendations(self, user_id, top_n=10):
        try:
            BIG_N = 2000
            content_recs = self.content_based_recommendations(
                user_id, top_n=BIG_N)
        except NotEnoughRatingsError:
            content_recs = []

        collab_recs = self.collaborative_filtering_recommendations(
            user_id, top_n=BIG_N)

        all_recs: dict[int, dict] = {}

        for rec in content_recs:
            movie_id = rec["movie"].id
            all_recs[movie_id] = {
                "movie": rec["movie"],
                "score": rec["score"] * 0.6,
                "reason": "Híbrido" + rec["reason"]
            }

        for rec in collab_recs:
            movie_id = rec["movie"].id
            if movie_id in all_recs:
                all_recs[movie_id]["score"] = (
                    all_recs[movie_id]["score"] + rec["score"] * 0.4
                ) / 2
                all_recs[movie_id]["reason"] = "Híbrido: Conteúdo + Colaborativo"
            else:
                all_recs[movie_id] = {
                    "movie": rec["movie"],
                    "score": rec["score"] * 0.4,
                    "reason": "Híbrido: " + rec["reason"]
                }

        recommendations = list(all_recs.values())
        recommendations.sort(key=lambda x: x["score"], reverse=True)

        return recommendations

    def hybrid_tv_recommendations(self, user_id, top_n=10):
        try:
            BIG_N = 2000
            content_recs = self.content_based_tv_recommendations(
                user_id, top_n=BIG_N)
        except NotEnoughRatingsError:
            content_recs = []

        collab_recs = self.collaborative_filtering_tv_recommendations(
            user_id, top_n=BIG_N)

        all_recs: dict[int, dict] = {}

        for rec in content_recs:
            tv_show_id = rec["tv_show"].id
            all_recs[tv_show_id] = {
                "tv_show": rec["tv_show"],
                "score": rec["score"] * 0.6,
                "reason": "Híbrido" + rec["reason"]
            }

        for rec in collab_recs:
            tv_show_id = rec["tv_show"].id
            if tv_show_id in all_recs:
                all_recs[tv_show_id]["score"] = (
                    all_recs[tv_show_id]["score"] + rec["score"] * 0.4
                ) / 2
                all_recs[tv_show_id]["reason"] = "Híbrido: Conteúdo + Colaborativo"
            else:
                all_recs[tv_show_id] = {
                    "tv_show": rec["tv_show"],
                    "score": rec["score"] * 0.4,
                    "reason": "Híbrido: " + rec["reason"]
                }

        recommendations = list(all_recs.values())
        recommendations.sort(key=lambda x: x["score"], reverse=True)

        return recommendations

    def get_popular_movies(self, top_n=10, offset=0):
        try:
            query = Movie.query.order_by(Movie.popularity.desc())

            total_count = query.count()

            movies = (
                query
                .limit(top_n)
                .offset(offset)
                .all()
            )
            random.shuffle(movies)

            return self._load_movie_details(movies, total_count)

        except Exception as e:
            print(f"❌ Erro ao buscar filmes populares {e}")
            return {"movies": [], "total_count": 0}

    def get_popular_tv_shows(self, top_n=10, offset=0):
        try:
            query = TVShow.query.order_by(TVShow.vote_count.desc())

            total_count = query.count()

            tv_shows = (
                query
                .limit(top_n)
                .offset(offset)
                .all()
            )
            random.shuffle(tv_shows)

            return self._load_tv_show_details(tv_shows, total_count)

        except Exception as e:
            print(f"❌ Erro ao buscar séries populares {e}")
            return {"tv_shows": [], "total_count": 0}


    def get_movies_by_genre(self, genre_id, top_n=10, offset=0, include_count=False):
        try:
            genre_name = GENRE_ID_TO_NAME.get(genre_id)

            if not genre_name:
                return {"movies": [], "total_count": 0}

            query = Movie.query.filter(Movie.genres.ilike(f"%{genre_name}%"))

            total_count = query.count()

            movies = (
                query
                .order_by(Movie.release_date.desc())
                .limit(top_n)
                .offset(offset)
                .all()
            )
            random.shuffle(movies)

            return self._load_movie_details(movies, total_count)

        except Exception as e:
            print(f"❌ Erro ao buscar filmes por gênero {genre_id}: {e}")
            return {"movies": [], "total_count": 0}

    def get_tv_shows_by_genre(self, genre_id, top_n=10, offset=0, include_count=False):
        try:
            genre_name = GENRE_ID_TO_NAME.get(genre_id)

            if not genre_name:
                return {"tv_shows": [], "total_count": 0}

            query = TVShow.query.filter(TVShow.genres.ilike(f"%{genre_name}%"))

            total_count = query.count()

            tv_shows = (
                query
                .order_by(TVShow.first_air_date.desc())
                .limit(top_n)
                .offset(offset)
                .all()
            )
            random.shuffle(tv_shows)

            return self._load_tv_show_details(tv_shows, total_count)

        except Exception as e:
            print(f"❌ Erro ao buscar séries por gênero {genre_id}: {e}")
            return {"tv_shows": [], "total_count": 0}

    def _load_movie_details(self, movies, total_count):
        for movie in movies:
            movie.user_rating = 0
            movie.watch_providers = getattr(movie, 'watch_providers', None)

        return {"movies": movies, "total_count": total_count}
        
    def _load_tv_show_details(self, tv_shows, total_count):
        for tv_show in tv_shows:
            tv_show.user_rating = 0

        return {"tv_shows": tv_shows, "total_count": total_count}