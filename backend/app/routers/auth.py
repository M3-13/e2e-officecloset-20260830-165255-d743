"""Authentication routes (register, login, logout).

The route bodies are implemented by the auth ticket; these stubs declare the
exact contract paths (``/api/auth/register``, ``/api/auth/login``,
``/api/auth/logout``) and answer 501 until the auth ticket fills them in.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.post("/register")
def register() -> None:
    raise HTTPException(
        status_code=501,
        detail="auth ticket implements POST /api/auth/register",
    )


@router.post("/login")
def login() -> None:
    raise HTTPException(
        status_code=501,
        detail="auth ticket implements POST /api/auth/login",
    )


@router.post("/logout")
def logout() -> None:
    raise HTTPException(
        status_code=501,
        detail="auth ticket implements POST /api/auth/logout",
    )
