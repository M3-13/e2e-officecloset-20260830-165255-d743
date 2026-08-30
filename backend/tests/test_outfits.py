"""Tests for the outfit routes.

These tests override ``get_current_user`` and ``get_db`` to drive the routes
with an in-memory database, so they do not depend on the auth ticket's
implementation of ``get_current_user``.
"""

from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.deps import get_current_user
from app.main import app
from app.models import Item, Outfit, User


@pytest.fixture
def ctx():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    session.expire_on_commit = False

    user_a = User(name="Alice", email="alice@example.com", password_hash="x")
    user_b = User(name="Bob", email="bob@example.com", password_hash="x")
    session.add_all([user_a, user_b])
    session.commit()

    item_a = Item(
        name="Seidenbluse",
        category="oberteil",
        image_url="/api/items/1/image",
        owner_id=user_a.id,
    )
    item_b = Item(
        name="Samthose",
        category="hose",
        image_url="/api/items/2/image",
        owner_id=user_b.id,
    )
    session.add_all([item_a, item_b])
    session.commit()

    def override_get_db():
        yield session

    def override_get_current_user():
        return user_a

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as client:
        yield SimpleNamespace(
            client=client,
            session=session,
            user_a=user_a,
            user_b=user_b,
            item_a=item_a,
            item_b=item_b,
        )

    app.dependency_overrides.clear()
    session.close()


def test_create_outfit_with_item_ids(ctx):
    resp = ctx.client.post("/api/outfits", json={"name": "Abendlook", "item_ids": [ctx.item_a.id]})
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Abendlook"
    assert body["item_ids"] == [ctx.item_a.id]
    assert body["owner_id"] == ctx.user_a.id
    assert ctx.session.get(Outfit, body["id"]) is not None


def test_get_outfit(ctx):
    outfit = Outfit(name="Alltag", item_ids=[ctx.item_a.id], owner_id=ctx.user_a.id)
    ctx.session.add(outfit)
    ctx.session.commit()

    resp = ctx.client.get(f"/api/outfits/{outfit.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == outfit.id
    assert body["name"] == "Alltag"
    assert body["item_ids"] == [ctx.item_a.id]


def test_list_outfits_returns_only_own(ctx):
    own = Outfit(name="Mein", item_ids=[ctx.item_a.id], owner_id=ctx.user_a.id)
    foreign = Outfit(name="Fremd", item_ids=[ctx.item_b.id], owner_id=ctx.user_b.id)
    ctx.session.add_all([own, foreign])
    ctx.session.commit()

    resp = ctx.client.get("/api/outfits")
    assert resp.status_code == 200
    ids = {o["id"] for o in resp.json()}
    assert own.id in ids
    assert foreign.id not in ids


def test_update_outfit(ctx):
    outfit = Outfit(name="Alt", item_ids=[ctx.item_a.id], owner_id=ctx.user_a.id)
    ctx.session.add(outfit)
    ctx.session.commit()

    resp = ctx.client.patch(f"/api/outfits/{outfit.id}", json={"name": "Neu"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Neu"
    assert resp.json()["item_ids"] == [ctx.item_a.id]


def test_delete_outfit(ctx):
    outfit = Outfit(name="Weg", item_ids=[ctx.item_a.id], owner_id=ctx.user_a.id)
    ctx.session.add(outfit)
    ctx.session.commit()

    resp = ctx.client.delete(f"/api/outfits/{outfit.id}")
    assert resp.status_code == 204
    assert ctx.session.get(Outfit, outfit.id) is None


def test_create_with_foreign_item_returns_404(ctx):
    resp = ctx.client.post("/api/outfits", json={"name": "Abendlook", "item_ids": [ctx.item_b.id]})
    assert resp.status_code == 404


def test_update_with_foreign_item_returns_404(ctx):
    outfit = Outfit(name="Eigen", item_ids=[ctx.item_a.id], owner_id=ctx.user_a.id)
    ctx.session.add(outfit)
    ctx.session.commit()

    resp = ctx.client.patch(f"/api/outfits/{outfit.id}", json={"item_ids": [ctx.item_b.id]})
    assert resp.status_code == 404


def test_foreign_outfit_returns_404(ctx):
    foreign = Outfit(name="Fremd", item_ids=[ctx.item_b.id], owner_id=ctx.user_b.id)
    ctx.session.add(foreign)
    ctx.session.commit()

    assert ctx.client.get(f"/api/outfits/{foreign.id}").status_code == 404
    assert ctx.client.patch(f"/api/outfits/{foreign.id}", json={"name": "X"}).status_code == 404
    assert ctx.client.delete(f"/api/outfits/{foreign.id}").status_code == 404
