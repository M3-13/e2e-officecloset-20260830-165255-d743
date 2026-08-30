"""Tests for registration, login, logout and JWT authentication."""

import bcrypt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models import User
from app.routers import auth as auth_module

REGISTER_PAYLOAD = {
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "password": "supersecret",
}


@pytest.fixture()
def ctx():
    settings.jwt_secret = "test-secret-key-for-authentication"
    auth_module._rate_limits.clear()

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as client:
            yield client, testing_session_local
    finally:
        app.dependency_overrides.clear()


def test_register_creates_user_and_returns_token(ctx) -> None:
    client, _ = ctx
    resp = client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and body["access_token"]
    assert body["user"]["name"] == "Ada Lovelace"
    assert body["user"]["email"] == "ada@example.com"
    assert isinstance(body["user"]["id"], int)


def test_register_duplicate_email_returns_409(ctx) -> None:
    client, _ = ctx
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    resp = client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    assert resp.status_code == 409
    assert "detail" in resp.json()


def test_register_with_missing_field_returns_400(ctx) -> None:
    client, _ = ctx
    resp = client.post(
        "/api/auth/register",
        json={"name": "Ada Lovelace", "email": "ada@example.com"},
    )

    assert resp.status_code == 400
    assert isinstance(resp.json()["detail"], str)


def test_login_with_valid_credentials_returns_token(ctx) -> None:
    client, _ = ctx
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    resp = client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "supersecret"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "ada@example.com"


def test_login_with_wrong_password_returns_401(ctx) -> None:
    client, _ = ctx
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    resp = client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "wrongpassword"},
    )

    assert resp.status_code == 401
    assert isinstance(resp.json()["detail"], str) and resp.json()["detail"]


def test_login_with_unknown_email_returns_401(ctx) -> None:
    client, _ = ctx
    resp = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "supersecret"},
    )

    assert resp.status_code == 401


def test_rate_limit_returns_429(ctx) -> None:
    client, _ = ctx
    payload = {"email": "missing@example.com", "password": "wrongpass"}
    statuses = [
        client.post("/api/auth/login", json=payload).status_code
        for _ in range(auth_module._RATE_LIMIT_MAX_ATTEMPTS + 1)
    ]

    assert (
        statuses[: auth_module._RATE_LIMIT_MAX_ATTEMPTS]
        == [401] * auth_module._RATE_LIMIT_MAX_ATTEMPTS
    )
    assert statuses[-1] == 429
    assert "detail" in client.post("/api/auth/login", json=payload).json()


def test_password_stored_hashed(ctx) -> None:
    client, session_factory = ctx
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    db: Session = session_factory()
    try:
        user = db.query(User).filter(User.email == "ada@example.com").first()
        assert user is not None
        assert user.password_hash != REGISTER_PAYLOAD["password"]
        assert bcrypt.checkpw(
            REGISTER_PAYLOAD["password"].encode("utf-8"),
            user.password_hash.encode("utf-8"),
        )
    finally:
        db.close()


def test_logout_requires_valid_token(ctx) -> None:
    client, _ = ctx
    register_body = client.post("/api/auth/register", json=REGISTER_PAYLOAD).json()
    token = register_body["access_token"]

    resp = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 204

    resp = client.post("/api/auth/logout", headers={"Authorization": "Bearer invalid.token.value"})
    assert resp.status_code == 401
