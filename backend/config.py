import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env
load_dotenv()

class Config:
    # Banco de Dados PostgreSQL
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'cinematch_db')
    DB_USER = os.getenv('DB_USER', 'cinematch_user')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'senha_padrao')
    
    SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'chave_padrao_insegura')
    
    # TMDB
    TMDB_API_KEY = os.getenv('TMDB_API_KEY', 'SUA_CHAVE_TMDB')
    TMDB_BASE_URL = "https://api.themoviedb.org/3"
    TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
    
    # Configurações de Recomendação
    # Este é o número mínimo de avaliações positivas (>= 7.0) necessárias para rodar o motor.
    MINIMUM_RATINGS_FOR_PERSONALIZED = 5
    
    # Flask
    FRONTEND_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))