"""
Configuration settings for Order Service.
"""
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    app_name: str = "OrderService"
    app_env: str = "development"
    log_level: str = "INFO"
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str = "redis://localhost:6379/5"
    
    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    
    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://frontend:3000",
        "http://0.0.0.0:3000"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
