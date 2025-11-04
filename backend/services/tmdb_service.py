import requests
from config import Config

def fetch_tmdb_data(endpoint, params=None):
    """Função genérica para fazer requisições à API do TMDB"""
    if params is None:
        params = {}
    params["api_key"] = Config.TMDB_API_KEY
    params["language"] = "pt-BR"
    
    try:
        response = requests.get(f"{Config.TMDB_BASE_URL}/{endpoint}", params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro na API do TMDB: {e}")
        return None
    

def get_movie_details(tmdb_id):
    """Obter detalhes completos de um filme"""
    movie_data = fetch_tmdb_data(f"movie/{tmdb_id}", {
        "append_to_response": "credits,keywords"
    })

    if not movie_data:
        return None

    # Diretor
    crew = movie_data.get("credits", {}).get("crew", [])
    director = next((p.get("name")
                    for p in crew if p.get("job") == "Director"), "")

    # Elenco principal (top 5)
    cast = movie_data.get("credits", {}).get("cast", [])[:5]
    cast_list = [actor.get("name") for actor in cast if actor.get("name")]

    # Palavras-chave
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
    
def search_movies_tmdb(query, page=1):
    """Buscar filmes na API do TMDB"""
    return fetch_tmdb_data("search/movie", {"query": query, "page": page})

def get_popular_movies(page=1):
    """Obter filmes populares"""
    return fetch_tmdb_data("movie/popular", {"page": page})

def get_movies_by_genre(genre_id, page=1):
    """Obter filmes por gênero"""
    return fetch_tmdb_data("discover/movie", {
        "with_genres": genre_id,
        "page": page,
        "sort_by": "popularity.desc"
    })