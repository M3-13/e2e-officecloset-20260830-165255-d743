"""Tests for the clothing-item management slice.

Every test provisions its own isolated SQLite database and upload directory and
overrides ``get_current_user`` so requests are authenticated without depending
on the auth ticket's implementation.
"""

import io

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base, get_db
from app.deps import get_current_user
from app.main import app
from app.models import User

PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n"
    + b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    + b"\x00\x00\x00\x00IEND\xaeB`\x82"
)
JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xd9"


@pytest.fixture
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "test.db"
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c, session_factory

    app.dependency_overrides.clear()


def _make_user(session_factory, name: str, email: str) -> User:
    with session_factory() as db:
        user = User(name=name, email=email, password_hash="x")
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


def _login_as(user: User) -> None:
    app.dependency_overrides[get_current_user] = lambda: user


def _create_item(client, user: User, name="Shirt", category="oberteil", image=PNG_BYTES):
    return client.post(
        "/api/items",
        data={"name": name, "category": category},
        files={"image": ("shirt.png", io.BytesIO(image), "image/png")},
    )


def test_create_item_with_image(client):
    client_, session_factory = client
    user = _make_user(session_factory, "Anna", "anna@example.com")
    _login_as(user)

    resp = _create_item(client_, user)

    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Shirt"
    assert body["category"] == "oberteil"
    assert body["owner_id"] == user.id
    assert body["image_url"] == f"/api/items/{body['id']}/image"


def test_list_items_only_own_and_filter_by_category(client):
    client_, session_factory = client
    user_a = _make_user(session_factory, "Anna", "anna@example.com")
    user_b = _make_user(session_factory, "Bob", "bob@example.com")
    _login_as(user_a)
    _create_item(client_, user_a, name="Hose", category="hose")
    _create_item(client_, user_a, name="Kleid", category="kleid")
    _login_as(user_b)
    _create_item(client_, user_b, name="BobShirt", category="oberteil")
    _login_as(user_a)

    resp = client_.get("/api/items")
    assert resp.status_code == 200
    items = resp.json()
    names = {item["name"] for item in items}
    assert names == {"Hose", "Kleid"}

    resp = client_.get("/api/items", params={"category": "hose"})
    assert resp.status_code == 200
    items = resp.json()
    assert [item["name"] for item in items] == ["Hose"]


def test_update_item_with_image_change(client):
    client_, session_factory = client
    user = _make_user(session_factory, "Anna", "anna@example.com")
    _login_as(user)

    created = _create_item(client_, user, name="Shirt", category="oberteil")
    item_id = created.json()["id"]

    resp = client_.patch(
        f"/api/items/{item_id}",
        data={"name": "Shirt Neu", "color": "rot"},
        files={"image": ("shirt.jpg", io.BytesIO(JPEG_BYTES), "image/jpeg")},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Shirt Neu"
    assert body["color"] == "rot"
    assert body["category"] == "oberteil"

    image = client_.get(f"/api/items/{item_id}/image")
    assert image.status_code == 200
    assert image.headers["content-type"] == "image/jpeg"
    assert image.content == JPEG_BYTES


def test_delete_item(client):
    client_, session_factory = client
    user = _make_user(session_factory, "Anna", "anna@example.com")
    _login_as(user)

    created = _create_item(client_, user)
    item_id = created.json()["id"]

    resp = client_.delete(f"/api/items/{item_id}")
    assert resp.status_code == 204

    assert client_.get(f"/api/items/{item_id}").status_code == 404


def test_foreign_item_returns_404(client):
    client_, session_factory = client
    user_a = _make_user(session_factory, "Anna", "anna@example.com")
    user_b = _make_user(session_factory, "Bob", "bob@example.com")
    _login_as(user_b)
    created = _create_item(client_, user_b)
    item_id = created.json()["id"]

    _login_as(user_a)
    assert client_.get(f"/api/items/{item_id}").status_code == 404
    assert client_.patch(f"/api/items/{item_id}", data={"name": "x"}).status_code == 404
    assert client_.delete(f"/api/items/{item_id}").status_code == 404
    assert client_.get(f"/api/items/{item_id}/image").status_code == 404


def test_invalid_image_returns_400(client):
    client_, session_factory = client
    user = _make_user(session_factory, "Anna", "anna@example.com")
    _login_as(user)

    resp = client_.post(
        "/api/items",
        data={"name": "Bad", "category": "oberteil"},
        files={"image": ("bad.txt", io.BytesIO(b"not an image"), "text/plain")},
    )
    assert resp.status_code == 400


def test_oversized_image_returns_413(client, monkeypatch):
    client_, session_factory = client
    user = _make_user(session_factory, "Anna", "anna@example.com")
    _login_as(user)

    monkeypatch.setattr(settings, "max_upload_size", 1024)

    resp = client_.post(
        "/api/items",
        data={"name": "Big", "category": "oberteil"},
        files={"image": ("big.png", io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"a" * 2048), "image/png")},
    )
    assert resp.status_code == 413


def test_item_image_served(client):
    client_, session_factory = client
    user = _make_user(session_factory, "Anna", "anna@example.com")
    _login_as(user)

    created = _create_item(client_, user)
    item_id = created.json()["id"]

    resp = client_.get(f"/api/items/{item_id}/image")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"
    assert resp.content == PNG_BYTES
