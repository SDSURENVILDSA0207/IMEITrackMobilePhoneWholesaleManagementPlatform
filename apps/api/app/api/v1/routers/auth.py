from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.auth import LoginInput, TokenResponse
from app.services.auth_service import login

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login_user(payload: LoginInput, db: Session = Depends(get_db)):
    token_pair = login(db, payload.email, payload.password)
    if token_pair is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return token_pair
