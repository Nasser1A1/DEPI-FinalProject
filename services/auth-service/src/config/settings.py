"""
Configuration settings for the Authentication Service.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    app_name: str = "AuthService"
    app_env: str = "development"
    log_level: str = "INFO"
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    
    # AWS S3 Configuration
    aws_access_key_id: str = "test"  # For LocalStack
    aws_secret_access_key: str = "test"  # For LocalStack
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "auth-service-images"
    s3_endpoint_url: Optional[str] = "http://localhost:4566"  # LocalStack endpoint
    
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
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
