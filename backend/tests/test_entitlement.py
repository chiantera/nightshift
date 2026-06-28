"""Maxx entitlement: membership status + webhook gating + event handling."""
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app import entitlement_service


@pytest.fixture(autouse=True)
def _clear_env(monkeypatch):
    for env in ("STRIPE_WEBHOOK_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_URL",
                "SUPABASE_ANON_KEY", "STRIPE_SECRET_KEY"):
        monkeypatch.delenv(env, raising=False)


def test_webhook_configured_requires_all(monkeypatch):
    assert entitlement_service.webhook_configured() is False
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_x")
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    assert entitlement_service.webhook_configured() is False
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "svc_x")
    assert entitlement_service.webhook_configured() is True


def test_webhook_503_when_unconfigured():
    client = TestClient(app)
    res = client.post("/api/stripe/webhook", content=b"{}", headers={"stripe-signature": "t=1,v1=x"})
    assert res.status_code == 503


def test_maxx_status_no_token_is_inactive():
    client = TestClient(app)
    res = client.get("/api/maxx/status")
    assert res.status_code == 200
    assert res.json() == {"active": False}


def test_handle_checkout_daypass_grants_24h(monkeypatch):
    captured = {}

    def fake_grant(user_id, plan, expires_at, customer_id=None, subscription_id=None, status="active"):
        captured.update(user_id=user_id, plan=plan, expires_at=expires_at)

    monkeypatch.setattr(entitlement_service, "grant_entitlement", fake_grant)
    event = {
        "type": "checkout.session.completed",
        "data": {"object": {
            "mode": "payment",
            "client_reference_id": "user-9",
            "metadata": {"plan": "daypass", "user_id": "user-9"},
            "customer": "cus_1",
        }},
    }
    entitlement_service.handle_stripe_event(event)
    assert captured["user_id"] == "user-9"
    assert captured["plan"] == "daypass"
    delta = captured["expires_at"] - datetime.now(timezone.utc)
    assert 23 * 3600 < delta.total_seconds() <= 24 * 3600


def test_handle_checkout_without_user_is_noop(monkeypatch):
    called = {"n": 0}
    monkeypatch.setattr(entitlement_service, "grant_entitlement", lambda *a, **k: called.__setitem__("n", called["n"] + 1))
    event = {"type": "checkout.session.completed", "data": {"object": {"mode": "payment", "metadata": {}}}}
    entitlement_service.handle_stripe_event(event)
    assert called["n"] == 0
