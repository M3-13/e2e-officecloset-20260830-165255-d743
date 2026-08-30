"""Tests for self-service account deletion (DELETE /api/account)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.config as config_module
from app.database import Base, get_db
from app.deps import get_current_user
from app.main import app
from app.models import Item, Outfit, User


@pytest.fixture()
def env(tmp_path):
    """Provision an isolated database, upload dir and auth override.

    The auth ticket is still a stub on this branch, so ``get_current_user`` is
    overridden with a real, known user and ``get_db`` with a session on an
    in-memory database. This keeps the test independent of the sibling ticket
    while exercising the account router for real.
    """
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    with testing_session() as db:
        user = User(name="Test Nutzer", email="test@example.com", password_hash="hash")
        db.add(user)
        db.flush()

        item_a = Item(name="Shirt", category="oberteil", image_url="", owner_id=user.id)
        item_b = Item(name="Hose", category="hose", image_url="", owner_id=user.id)
        db.add_all([item_a, item_b])
        db.flush()

        item_a.image_url = f"/api/items/{item_a.id}/image"
        item_b.image_url = f"/api/items/{item_b.id}/image"

        outfit = Outfit(name="Look", item_ids=[item_a.id], owner_id=user.id)
        db.add(outfit)
        db.commit()
        user_id = user.id
        item_ids = [item_a.id, item_b.id]

    (upload_dir / f"{item_ids[0]}.jpg").write_bytes(b"image-a")
    (upload_dir / f"{item_ids[1]}.png").write_bytes(b"image-b")

    def override_get_db():
        session = testing_session()
        try:
            yield session
        finally:
            session.close()

    def override_get_current_user():
        with testing_session() as session:
            return session.get(User, user_id)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    original_upload_dir = config_module.settings.upload_dir
    config_module.settings.upload_dir = str(upload_dir)

    yield user_id, upload_dir, testing_session, item_ids

    app.dependency_overrides.clear()
    config_module.settings.upload_dir = original_upload_dir


def test_delete_account_removes_user_items_outfits_and_images(env) -> None:
    user_id, upload_dir, testing_session, item_ids = env

    client = TestClient(app)
    resp = client.delete("/api/account", headers={"Authorization": "Bearer token"})

    assert resp.status_code == 204

    with testing_session() as db:
        assert db.get(User, user_id) is None
        assert db.scalars(select(Item).where(Item.owner_id == user_id)).all() == []
        assert db.scalars(select(Outfit).where(Outfit.owner_id == user_id)).all() == []

    assert not (upload_dir / f"{item_ids[0]}.jpg").exists()
    assert not (upload_dir / f"{item_ids[1]}.png").exists()


def test_login_with_old_credentials_fails_after_deletion(env) -> None:
    """After deletion the user no longer exists, so the auth lookup returns
    nothing — which is what makes a subsequent ``POST /api/auth/login`` answer
    401. (The auth endpoint itself is another ticket's stub on this branch, so
    this asserts the underlying invariant instead of the stub's answer.)"""
    user_id, _upload_dir, testing_session, _item_ids = env

    client = TestClient(app)
    resp = client.delete("/api/account", headers={"Authorization": "Bearer token"})

    assert resp.status_code == 204

    with testing_session() as db:
        assert db.get(User, user_id) is None
        assert db.scalar(select(User).where(User.email == "test@example.com")) is None
