"""
Authentication service containing business logic for auth operations.
"""
from typing import Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from src.infrastructure.database.user_repository import UserRepository
from src.infrastructure.security.jwt_handler import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token
)
from src.domain.models.user import User
from src.application.dtos.auth_schemas import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    TokenResponse,
    LoginResponse
)
from src.config.settings import settings


class AuthService:
    """Service class for authentication business logic"""
    
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
    
    async def register(self, request: RegisterRequest) -> UserResponse:
        """
        Register a new user.
        
        Args:
            request: Registration request data
            
        Returns:
            Created user data
            
        Raises:
            ValueError: If user already exists
        """
        # Check if user exists
        if await self.user_repo.exists_by_email(request.email):
            raise ValueError(f"User with email {request.email} already exists")
        
        # Hash password
        password_hash = hash_password(request.password)
        
        # Create user
        user = await self.user_repo.create(
            email=request.email,
            password_hash=password_hash,
            full_name=request.full_name
        )
        
        return UserResponse.model_validate(user)
    
    async def login(self, request: LoginRequest) -> LoginResponse:
        """
        Authenticate user and return tokens.
        
        Args:
            request: Login request data
            
        Returns:
            Login response with tokens and user data
            
        Raises:
            ValueError: If credentials are invalid
        """
        # Get user by email
        user = await self.user_repo.get_by_email(request.email)
        
        if not user:
            raise ValueError("Invalid email or password")
        
        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise ValueError("Invalid email or password")
        
        # Check if user is active
        if not user.is_active:
            raise ValueError("User account is disabled")
        
        # Generate tokens
        access_token = create_access_token(str(user.id), user.email)
        refresh_token = create_refresh_token(str(user.id))
        
        # Store refresh token in database
        await self.user_repo.create_refresh_token(
            user_id=user.id,
            token=refresh_token,
            expires_days=settings.refresh_token_expire_days
        )
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
            user=UserResponse.model_validate(user)
        )
    
    async def refresh(self, refresh_token: str) -> TokenResponse:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: JWT refresh token
            
        Returns:
            New access and refresh tokens
            
        Raises:
            ValueError: If refresh token is invalid
        """
        # Verify refresh token JWT
        user_id_str = verify_refresh_token(refresh_token)
        
        if not user_id_str:
            raise ValueError("Invalid refresh token")
        
        # Check if token exists in database and is valid
        token_record = await self.user_repo.get_refresh_token(refresh_token)
        
        if not token_record or not token_record.is_valid():
            raise ValueError("Invalid or expired refresh token")
        
        # Get user
        user_id = UUID(user_id_str)
        user = await self.user_repo.get_by_id(user_id)
        
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")
        
        # Revoke old refresh token
        await self.user_repo.revoke_refresh_token(refresh_token)
        
        # Generate new tokens
        new_access_token = create_access_token(str(user.id), user.email)
        new_refresh_token = create_refresh_token(str(user.id))
        
        # Store new refresh token
        await self.user_repo.create_refresh_token(
            user_id=user.id,
            token=new_refresh_token,
            expires_days=settings.refresh_token_expire_days
        )
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60
        )
    
    async def logout(self, user_id: UUID, access_token: str = None) -> bool:
        """
        Logout user by revoking all refresh tokens and blacklisting access token.
        
        Args:
            user_id: User's unique identifier
            access_token: Access token to blacklist (optional)
            
        Returns:
            True if successful
        """
        # Revoke all refresh tokens from database
        count = await self.user_repo.revoke_all_user_tokens(user_id)
        
        # Blacklist the access token in Redis if provided
        if access_token:
            from src.infrastructure.cache.redis_client import redis_client
            # Blacklist for remaining token lifetime
            redis_client.blacklist_token(
                access_token, 
                settings.access_token_expire_minutes * 60
            )
        
        # Invalidate user cache
        from src.infrastructure.cache.redis_client import redis_client
        redis_client.invalidate_user_cache(str(user_id))
        
        return count > 0
    
    async def get_user(self, user_id: UUID) -> UserResponse:
        """
        Get user by ID.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            User data
            
        Raises:
            ValueError: If user not found
        """
        user = await self.user_repo.get_by_id(user_id)
        
        if not user:
            raise ValueError("User not found")
        
        return UserResponse.model_validate(user)
    
    async def update_profile_picture(self, user_id: UUID, file: any, filename: str) -> UserResponse:
        """
        Update user's profile picture.
        
        Args:
            user_id: User's unique identifier
            file: Image file to upload
            filename: Original filename
            
        Returns:
            Updated user data
            
        Raises:
            ValueError: If user not found or upload fails
        """
        from src.infrastructure.storage.s3_client import s3_client
        
        # Get user
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Delete old profile picture if exists
        if user.profile_picture_url:
            s3_client.delete_profile_picture(user.profile_picture_url)
        
        # Upload new profile picture
        image_url = s3_client.upload_profile_picture(
            file=file,
            filename=filename,
            user_id=str(user_id)
        )
        
        if not image_url:
            raise ValueError("Failed to upload profile picture")
        
        # Update user record
        user.profile_picture_url = image_url
        self.db.commit()
        self.db.refresh(user)
        
        # Invalidate cache
        from src.infrastructure.cache.redis_client import redis_client
        redis_client.invalidate_user_cache(str(user_id))
        
        return UserResponse.model_validate(user)

