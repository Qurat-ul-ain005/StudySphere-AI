from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate
from app.auth.security import hash_password, verify_password


router = APIRouter()


# ==========================
# REGISTER
# ==========================

@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    # Check if email already exists
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered."
        )

    # Create new user
    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully."
    }


# ==========================
# LOGIN REQUEST
# ==========================

class LoginRequest(BaseModel):
    email: str
    password: str


# ==========================
# LOGIN
# ==========================

@router.post("/login")
def login(
    user: LoginRequest,
    db: Session = Depends(get_db)
):

    # Find user by email
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    # User not found
    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # Check password
    if not verify_password(
        user.password,
        existing_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    return {
        "message": "Login successful.",
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email
        }
    }