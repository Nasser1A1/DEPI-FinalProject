"""
JWT token handling and password hashing utilities.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from passlib.context import CryptContext
from src.config.settings import settings

# Password hashing context - using Argon2 which has no password length limit
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password using Argon2.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str, email: str) -> str:
    """
    Create a JWT access token.
    
    Args:
        user_id: User's unique identifier
        email: User's email address
        
    Returns:
        Encoded JWT access token
    """
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    expire = datetime.utcnow() + expires_delta
    
    to_encode = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    
    return encoded_jwt


def create_refresh_token(user_id: str) -> str:
    """
    Create a JWT refresh token with longer expiration.
    
    Args:
        user_id: User's unique identifier
        
    Returns:
        Encoded JWT refresh token
    """
    expires_delta = timedelta(days=settings.refresh_token_expire_days)
    expire = datetime.utcnow() + expires_delta
    
    to_encode = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    
    return encoded_jwt


def decode_token(token: str) -> Dict:
    """
    Decode and verify a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError as e:
        raise e


def verify_access_token(token: str) -> Optional[str]:
    """
    Verify an access token and return user_id if valid.
    
    Args:
        token: JWT access token
        
    Returns:
        User ID if token is valid, None otherwise
    """
    try:
        payload = decode_token(token)
        
        if payload.get("type") != "access":
            return None
        
        user_id: str = payload.get("sub")
        return user_id
    except JWTError:
        return None


def verify_refresh_token(token: str) -> Optional[str]:
    """
    Verify a refresh token and return user_id if valid.
    
    Args:
        token: JWT refresh token
        
    Returns:
        User ID if token is valid, None otherwise
    """
    try:
        payload = decode_token(token)
        
        if payload.get("type") != "refresh":
            return None
        
        user_id: str = payload.get("sub")
        return user_id
    except JWTError:
        return None
