from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Any

from app import models, schemas
from app.database import get_db
from app.core import security
from app.core.security import create_tokens
from app.services import auth_service
from app.core.oauth import verify_google_token

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=schemas.Token)
async def register(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Create a new user account
    """
    # Create user
    user = auth_service.create_user(db, user_in)
    
    # Generate tokens
    tokens = create_tokens(user)
    return tokens

@router.post("/login", response_model=schemas.Token)
def login(
    user_credentials: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    user = auth_service.authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=schemas.Token)
async def google_auth(
    google_data: schemas.UserGoogleAuth,
    db: Session = Depends(get_db)
) -> Any:
    """
    Google OAuth2 authentication
    """
    try:
        google_user = await verify_google_token(google_data.token)
        user = auth_service.get_or_create_user_from_google(db, google_user)
        tokens = create_tokens(user)
        return tokens
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to complete Google authentication: {str(e)}"
        )

@router.get("/me", response_model=schemas.UserResponse)
async def read_users_me(
    current_user: models.User = Depends(auth_service.get_current_active_user)
) -> Any:
    """
    Get current user information
    """
    return current_user
