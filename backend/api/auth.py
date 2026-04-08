"""
Authentication API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger

from pydantic import BaseModel
import pyotp
import qrcode
import base64
import io
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from config import settings
from database.connection import get_db
from models.user import User, UserCreate, UserLogin, UserResponse, TokenResponse
from utils.auth import hash_password, verify_password, create_token_pair, get_current_user, get_current_refresh_user, TokenData

class GoogleLoginRequest(BaseModel):
    token: str

class MFASetupResponse(BaseModel):
    secret: str
    qr_code: str

class MFAVerifyRequest(BaseModel):
    token: str
    code: str

class MFATempTokenResponse(BaseModel):
    mfa_required: bool
    temp_token: str

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.
    
    Args:
        user_data: User registration data
        db: Database session
    
    Returns:
        Created user information
    """
    try:
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = hash_password(user_data.password)
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            full_name=user_data.full_name
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        logger.info(f"New user registered: {new_user.email}")
        return new_user
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in register: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Login user and return JWT tokens.
    
    Args:
        credentials: Login credentials
        db: Database session
    
    Returns:
        Access and refresh tokens
    """
    try:
        # Find user
        result = await db.execute(
            select(User).where(User.email == credentials.email)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email address."
            )
        
        # Verify password
        if not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please try again."
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact support."
            )
        
        if user.mfa_enabled:
            from utils.auth import create_access_token
            from datetime import timedelta
            temp_token = create_access_token(
                {"sub": str(user.id), "email": user.email, "type": "mfa_temp"},
                expires_delta=timedelta(minutes=5)
            )
            return {
                "mfa_required": True,
                "temp_token": temp_token
            }
        
        # Create tokens
        tokens = create_token_pair(str(user.id), user.email)
        
        logger.info(f"User logged in: {user.email}")
        return tokens
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user profile.
    
    Args:
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        User profile information
    """
    try:
        result = await db.execute(
            select(User).where(User.id == current_user.user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch profile"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    current_user: TokenData = Depends(get_current_refresh_user)
):
    """
    Refresh access token using refresh token.
    
    Args:
        current_user: Current user from refresh token
    
    Returns:
        New access and refresh tokens
    """
    try:
        tokens = create_token_pair(current_user.user_id, current_user.email)
        logger.info(f"Token refreshed for user: {current_user.email}")
        return tokens
    
    except Exception as e:
        logger.error(f"Error in refresh_token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


# Password Reset Schemas
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime, timedelta
import uuid
import re
from utils.email import EmailService
from config import settings

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        return v

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request a password reset email.
    """
    try:
        # Find user
        result = await db.execute(
            select(User).where(User.email == request.email)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email address."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated. Please contact support."
            )

        # Block admin accounts from using the public password reset flow
        if user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin accounts cannot use the public password reset. Please contact your system administrator."
            )
            
        # Generate token
        token = str(uuid.uuid4())
        user.reset_token = token
        user.reset_token_expires = datetime.utcnow() + timedelta(minutes=30)
        
        await db.commit()
        
        # Send email
        email_service = EmailService()
        host = settings.frontend_url
        
        await email_service.send_reset_password_email(user.email, token, host)
        
        logger.info(f"Password reset email sent to: {user.email}")
        return {"message": "Password reset link sent to your email."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in forgot_password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reset email. Please try again later."
        )

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password using a valid token.
    """
    try:
        # Find user by token
        result = await db.execute(
            select(User).where(User.reset_token == request.token)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This reset link is invalid. Please request a new one."
            )
            
        # Check expiry
        if user.reset_token_expires < datetime.utcnow():
            # Invalidate the expired token
            user.reset_token = None
            user.reset_token_expires = None
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This reset link has expired (valid for 30 minutes). Please request a new one."
            )
            
        # Update password
        user.password_hash = hash_password(request.new_password)
        user.reset_token = None
        user.reset_token_expires = None
        
        await db.commit()
        
        logger.info(f"Password reset successful for user: {user.email}")
        return {"message": "Password reset successful. You can now log in with your new password."}
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in reset_password: {str(e)}")
        raise HTTPException(
        )

@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate MFA secret and QR code for the current user."""
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")
        
    secret = pyotp.random_base32()
    current_user.mfa_secret = secret
    db.add(current_user)
    await db.commit()
    
    # Generate QR Code
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=current_user.email, issuer_name="NexusLearn")
    
    img = qrcode.make(provisioning_uri)
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{img_base64}"
    }

@router.post("/mfa/enable")
async def enable_mfa(
    request: MFAVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify first MFA code and enable MFA."""
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")
        
    if not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA setup not initiated")
        
    totp = pyotp.TOTP(current_user.mfa_secret)
    if not totp.verify(request.code):
        raise HTTPException(status_code=400, detail="Invalid MFA code")
        
    current_user.mfa_enabled = True
    db.add(current_user)
    await db.commit()
    
    return {"message": "MFA enabled successfully"}

@router.post("/mfa/verify", response_model=TokenResponse)
async def verify_mfa(
    request: MFAVerifyRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verify MFA code during login using temp_token."""
    from utils.auth import create_access_token, create_refresh_token, verify_token, create_token_pair
    
    payload = verify_token(request.token, "access")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired temporary token")
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not user.mfa_enabled or not user.mfa_secret:
        raise HTTPException(status_code=404, detail="MFA setup not complete or user not found")
        
    totp = pyotp.TOTP(user.mfa_secret)
    if not totp.verify(request.code):
        raise HTTPException(status_code=400, detail="Invalid MFA code")
        
    # Generate final tokens
    tokens = create_token_pair(str(user.id), user.email)
    
    return tokens

@router.post("/google-login", response_model=TokenResponse)
async def google_login(
    request: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Login or register via Google SSO."""
    from utils.auth import create_token_pair
    import string
    import random
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            request.token, google_requests.Request(), settings.google_client_id
        )
        
        email = idinfo.get("email")
        google_id = idinfo.get("sub")
        name = idinfo.get("name", "Google User")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
            
        # Check if user already exists
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if user:
            # Update google_id if not set (account linking)
            if not user.google_id:
                user.google_id = google_id
                db.add(user)
                await db.commit()
                
            # If MFA is enabled on a verified existing user, return temp token
            if user.mfa_enabled:
                 from utils.auth import create_access_token
                 from datetime import timedelta
                 temp_token = create_access_token(
                     {"sub": str(user.id), "email": user.email, "type": "mfa_temp"},
                     expires_delta=timedelta(minutes=5)
                 )
                 return {
                     "mfa_required": True,
                     "temp_token": temp_token,
                     "access_token": "temp",
                     "refresh_token": "temp",
                     "token_type": "bearer"
                 }
                 
            tokens = create_token_pair(str(user.id), user.email)
            return tokens
        else:
            # Create new user
            chars = string.ascii_letters + string.digits + string.punctuation
            dummy_pass = ''.join(random.choice(chars) for _ in range(32))
            
            new_user = User(
                email=email,
                full_name=name,
                google_id=google_id,
                is_active=True,
                is_verified=True,  # Google emails are verified
                password_hash=hash_password(dummy_pass)  # Dummy hash
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            
            tokens = create_token_pair(str(new_user.id), new_user.email)
            return tokens
            
    except ValueError as e:
        logger.error(f"Google token verification failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid Google token")
