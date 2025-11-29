"""
Authentication routes/endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from src.infrastructure.database.connection import get_db
from src.application.services.auth_service import AuthService
from src.application.dtos.auth_schemas import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    UserResponse,
    LoginResponse,
    TokenResponse,
    MessageResponse
)
from src.presentation.middlewares.auth_middleware import get_current_user_id
from src.presentation.middlewares.rate_limit import limiter, strict_rate_limit, moderate_rate_limit, permissive_rate_limit
from uuid import UUID

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")  # Strict rate limit for registration
async def register(
    request: Request,
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    - **email**: Valid email address
    - **password**: Minimum 8 characters with uppercase, lowercase, and digit
    - **full_name**: User's full name
    
    Returns the created user data (without password).
    
    **Rate Limit:** 5 requests per minute
    """
    auth_service = AuthService(db)
    
    try:
        user = await auth_service.register(data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")  # Strict rate limit for login (prevent brute force)
async def login(
    request: Request,
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and receive access and refresh tokens.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns access token, refresh token, and user data.
    
    **Rate Limit:** 5 requests per minute (prevents brute-force attacks)
    """
    auth_service = AuthService(db)
    
    try:
        response = await auth_service.login(data)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")  # Moderate rate limit for refresh
async def refresh(
    request: Request,
    data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token
    
    Returns new access and refresh tokens.
    
    **Rate Limit:** 20 requests per minute
    """
    auth_service = AuthService(db)
    
    try:
        response = await auth_service.refresh(data.refresh_token)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Logout user by revoking all refresh tokens and blacklisting access token.
    
    Requires valid access token in Authorization header.
    """
    auth_service = AuthService(db)
    
    # Extract access token to blacklist it
    access_token = credentials.credentials
    
    success = await auth_service.logout(current_user_id, access_token)
    
    if success:
        return MessageResponse(message="Successfully logged out")
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logout failed"
        )


@router.get("/me", response_model=UserResponse)
@limiter.limit("100/minute")  # Permissive rate limit for user info
async def get_current_user(
    request: Request,
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user's information.
    
    Requires valid access token in Authorization header.
    
    **Rate Limit:** 100 requests per minute
    """
    auth_service = AuthService(db)
    
    try:
        user = await auth_service.get_user(current_user_id)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/profile-picture", response_model=UserResponse)
@limiter.limit("10/minute")  # Moderate rate limit for upload
async def upload_profile_picture(
    request: Request,
    file: UploadFile = File(...),
    current_user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Upload profile picture for current user.
    
    Accepts image files (JPG, PNG, GIF) up to 5MB.
    
    Requires valid access token in Authorization header.
    
    **Rate Limit:** 10 requests per minute
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size (5MB max)
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit"
        )
    
    # Reset file pointer for reading again
    await file.seek(0)
    
    auth_service = AuthService(db)
    
    try:
        user = await auth_service.update_profile_picture(
            user_id=current_user_id,
            file=file.file,
            filename=file.filename
        )
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
