import requests
from config import Config


def fetch_tmdb_data(endpoint, params=None):
    if params is None:
        params = {}
    params["api_key"] = Config.TMDB_API_KEY
    params["language"] = "pt-BR"

    try:
        response = requests.get(
            f"{Config.TMDB_BASE_URL}/{endpoint}", params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro na API do TMDB: {e}")
        return None


def get_movie_details(tmdb_id):
    movie_data = fetch_tmdb_data(f"movie/{tmdb_id}", {
        "append_to_response": "credits,keywords"
    })

    if not movie_data:
        return None

    crew = movie_data.get("credits", {}).get("crew", [])
    director = next((p.get("name")
                    for p in crew if p.get("job") == "Director"), "")

    cast = movie_data.get("credits", {}).get("cast", [])[:5]
    cast_list = [actor.get("name") for actor in cast if actor.get("name")]

    keywords = movie_data.get("keywords", {}).get("keywords", [])
    keywords_list = [kw.get("name") for kw in keywords if kw.get("name")]

    return {
        "tmdb_id": movie_data.get("id"),
        "title": movie_data.get("title", ""),
        "overview": movie_data.get("overview", ""),
        "genres": ",".join([g.get("name", "") for g in movie_data.get("genres", [])]),
        "release_date": movie_data.get("release_date", ""),
        "poster_path": movie_data.get("poster_path", ""),
        "backdrop_path": movie_data.get("backdrop_path", ""),
        "vote_average": movie_data.get("vote_average", 0),
        "vote_count": movie_data.get("vote_count", 0),
        "runtime": movie_data.get("runtime", 0),
        "director": director,
        "cast": ",".join(cast_list),
        "keywords": ",".join(keywords_list),
    }


def get_tv_show_details(tmdb_id):
    tv_data = fetch_tmdb_data(f"tv/{tmdb_id}", {
        "append_to_response": "credits,keywords"
    })

    if not tv_data:
        return None

    title = tv_data.get("name", "")

    cast = tv_data.get("credits", {}).get("cast", [])[:5]
    cast_list = [actor.get("name") for actor in cast if actor.get("name")]

    keywords = tv_data.get("keywords", {}).get("results", [])
    keywords_list = [kw.get("name") for kw in keywords if kw.get("name")]

    adult = tv_data.get("adult", False)
    genres = [g.get("name", "") for g in tv_data.get("genres", [])]
    genre_ids = [g.get("id") for g in tv_data.get("genres", [])]

    if 37 in genre_ids or adult:
        return None

    return {
        "tmdb_id": tv_data.get("id"),
        "title": title,
        "overview": tv_data.get("overview", ""),
        "genres": ",".join(genres),
        "first_air_date": tv_data.get("first_air_date", ""),
        "poster_path": tv_data.get("poster_path", ""),
        "backdrop_path": tv_data.get("backdrop_path", ""),
        "vote_average": tv_data.get("vote_average", 0),
        "vote_count": tv_data.get("vote_count", 0),
        "number_of_seasons": tv_data.get("number_of_seasons", 0),
        "number_of_episodes": tv_data.get("number_of_episodes", 0),
        "cast": ",".join(cast_list),
        "keywords": ",".join(keywords_list),
    }


def search_movies_tmdb(query, page=1):
    return fetch_tmdb_data("search/movie", {"query": query, "page": page})


def search_tv_shows_tmdb(query, page=1):
    return fetch_tmdb_data("search/tv", {"query": query, "page": page})


def get_popular_movies(page=1):
    return fetch_tmdb_data("movie/popular", {"page": page})


def get_popular_tv_shows(page=1):
    return fetch_tmdb_data("tv/popular", {"page": page})


def get_movies_by_genre(genre_id, page=1):
    return fetch_tmdb_data("discover/movie", {
        "with_genres": genre_id,
        "page": page,
        "sort_by": "popularity.desc"
    })


def get_tv_shows_by_genre(genre_id, page=1):
    return fetch_tmdb_data("discover/tv", {
        "with_genres": genre_id,
        "page": page,
        "sort_by": "popularity.desc"
    })