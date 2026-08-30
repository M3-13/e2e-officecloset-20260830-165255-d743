"""Shared FastAPI dependencies."""

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

__all__ = ["get_current_user", "get_db"]


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    raise HTTPException(
        status_code=501,
        detail="get_current_user is implemented by the auth ticket",
    )
