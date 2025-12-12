import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")

    if not SQLALCHEMY_DATABASE_URI:
        DB_HOST = os.getenv('DB_HOST', 'localhost')
        DB_PORT = os.getenv('DB_PORT', '5432')
        DB_NAME = os.getenv('DB_NAME', 'cinematch_db')
        DB_USER = os.getenv('DB_USER', 'cinematch_user')
        DB_PASSWORD = os.getenv('DB_PASSWORD', 'senha_padrao')
        SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SECRET_KEY = os.getenv('SECRET_KEY', 'chave_padrao_insegura')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'supersecretkey')

    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_COOKIE_SECURE = True if os.getenv(
        "FLASK_ENV") == "production" else False
    JWT_COOKIE_SAMESITE = 'None'
    JWT_COOKIE_CSRF_PROTECT = False

    JWT_ACCESS_CSRF_COOKIE_HTTPONLY = False
    JWT_ACCESS_CSRF_COOKIE_SECURE = True if os.getenv(
        "FLASK_ENV") == "production" else False
    JWT_ACCESS_CSRF_COOKIE_SAMESITE = 'None'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    TMDB_API_KEY = os.getenv('TMDB_API_KEY', 'SUA_CHAVE_TMDB')
    TMDB_BASE_URL = "https://api.themoviedb.org/3"
    TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original"

    FRONTEND_PATH = os.path.abspath(os.path.join(
        os.path.dirname(__file__), '..', 'frontend', 'dist'))
    TMDB_ACCESS_TOKEN = os.getenv('TMDB_ACCESS_TOKEN', 'SEU_ACCESS_TOKEN')

    MINIMUM_RATINGS_FOR_PERSONALIZED = 5