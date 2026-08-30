"""Tests for the backend skeleton: health endpoint and CORS configuration."""

from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_200() -> None:
    with TestClient(app) as client:
        resp = client.get("/api/health")

    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_cors_allows_configured_origin() -> None:
    with TestClient(app) as client:
        resp = client.get("/api/health", headers={"Origin": "http://localhost:5173"})

    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_rejects_unknown_origin() -> None:
    with TestClient(app) as client:
        resp = client.get("/api/health", headers={"Origin": "http://evil.example.com"})

    assert resp.status_code == 200
    assert "access-control-allow-origin" not in resp.headers
