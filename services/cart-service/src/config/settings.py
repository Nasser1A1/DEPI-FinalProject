"""
Configuration settings for Cart Service.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    app_name: str = "CartService"
    app_env: str = "development"
    log_level: str = "INFO"
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str = "redis://localhost:6379/3"
    
    # JWT (for auth validation)
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    
    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://frontend:3000",
        "http://0.0.0.0:3000"
    ]
    
    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_per_minute: int = 60
    
    # External Services
    product_service_url: str = "http://localhost:8002"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
