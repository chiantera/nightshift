"""Stripe Connect onboarding endpoints — env gating + auth."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app import connect_service


@pytest.fixture(autouse=True)
def _clear_connect_env(monkeypatch):
    for env in ("STRIPE_SECRET_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"):
        monkeypatch.delenv(env, raising=False)


def test_connect_configured_requires_all(monkeypatch):
    assert connect_service.connect_configured() is False
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_x")
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    assert connect_service.connect_configured() is False  # anon key still missing
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon_x")
    assert connect_service.connect_configured() is True


def test_onboard_503_when_unconfigured():
    client = TestClient(app)
    res = client.post("/api/connect/onboard", headers={"Authorization": "Bearer x"})
    assert res.status_code == 503


def test_status_503_when_unconfigured():
    client = TestClient(app)
    res = client.get("/api/connect/status", headers={"Authorization": "Bearer x"})
    assert res.status_code == 503


def test_onboard_401_when_token_invalid(monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_x")
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon_x")
    monkeypatch.setattr("app.main.get_user_id", lambda token: None)
    client = TestClient(app)
    res = client.post("/api/connect/onboard", headers={"Authorization": "Bearer bad"})
    assert res.status_code == 401


def test_status_returns_payload_when_authed(monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_x")
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon_x")
    monkeypatch.setattr("app.main.get_user_id", lambda token: "user-123")
    monkeypatch.setattr("app.main.connect_get_status", lambda token: {"onboarded": True, "charges_enabled": False})
    client = TestClient(app)
    res = client.get("/api/connect/status", headers={"Authorization": "Bearer good"})
    assert res.status_code == 200
    assert res.json() == {"onboarded": True, "charges_enabled": False}
