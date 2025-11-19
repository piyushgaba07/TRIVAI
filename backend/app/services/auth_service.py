from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app import models, schemas
from app.core import security
from app.database import get_db
from typing import Optional, TypeVar, Type, Any
from pydantic import BaseModel
from jose import JWTError

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Type variable for SQLAlchemy models
ModelType = TypeVar("ModelType")

# Type variable for Pydantic schemas
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

def create_user(db: Session, user: 'schemas.UserCreate') -> 'models.User':
    # Check if user with email already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username is taken
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        is_verified=True  # For simplicity, mark as verified. In production, send verification email.
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> Optional['models.User']:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    if not security.verify_password(password, user.hashed_password):
        return None
    return user

def get_or_create_user_from_google(db: Session, google_user: dict):
    # Implementation here...
    pass

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Get the current authenticated user from the JWT token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = security.verify_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """
    Check if the current user is active.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_or_create_user_from_google(db: Session, google_user: dict) -> 'models.User':
    # Check if user exists by google_id
    user = db.query(models.User).filter(
        models.User.google_id == google_user['google_id']
    ).first()
    
    if user:
        return user
    
    # Check if email exists but not linked to Google
    user = db.query(models.User).filter(
        models.User.email == google_user['email']
    ).first()
    
    if user:
        # Link existing account with Google
        user.google_id = google_user['google_id']
        db.commit()
        db.refresh(user)
        return user
    
    # Create new user
    username = google_user['email'].split('@')[0]
    # Ensure username is unique
    base_username = username
    counter = 1
    while db.query(models.User).filter(models.User.username == username).first() is not None:
        username = f"{base_username}{counter}"
        counter += 1
    
    new_user = models.User(
        email=google_user['email'],
        username=username,
        google_id=google_user['google_id'],
        is_verified=True,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
