"""Authentication routes (register, login, logout).

Passwords are stored exclusively as bcrypt hashes (never in plaintext). Register
and login are rate-limited per client (IP) with a simple in-memory sliding
window to make brute-force attacks harder.
"""

import time
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut

router = APIRouter()

_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

_RATE_LIMIT_WINDOW_SECONDS = 60
_RATE_LIMIT_MAX_ATTEMPTS = 5

_rate_limits: dict[str, list[float]] = {}


def _client_key(request: Request, action: str) -> str:
    ip = request.client.host if request.client else "unknown"
    return f"{ip}:{action}"


def _enforce_rate_limit(request: Request, action: str) -> None:
    key = _client_key(request, action)
    now = time.monotonic()
    recent = [
        timestamp
        for timestamp in _rate_limits.setdefault(key, [])
        if now - timestamp < _RATE_LIMIT_WINDOW_SECONDS
    ]
    if len(recent) >= _RATE_LIMIT_MAX_ATTEMPTS:
        _rate_limits[key] = recent
        raise HTTPException(
            status_code=429,
            detail="Zu viele Versuche. Bitte versuchen Sie es später erneut.",
        )
    recent.append(now)
    _rate_limits[key] = recent


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _create_access_token(user_id: int) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=_ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def _token_response(user: User, access_token: str) -> TokenResponse:
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut(id=user.id, name=user.name, email=user.email),
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    body: RegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    _enforce_rate_limit(request, "register")

    email = body.email.strip().lower()
    if db.query(User).filter(User.email == email).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Diese E-Mail ist bereits registriert",
        )

    user = User(
        name=body.name.strip(),
        email=email,
        password_hash=_hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _token_response(user, _create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    _enforce_rate_limit(request, "login")

    email = body.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None or not _verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-Mail oder Passwort ist falsch",
        )

    return _token_response(user, _create_access_token(user.id))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(_: User = Depends(get_current_user)) -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)
