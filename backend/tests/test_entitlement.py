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


def test_webhook_valid_signature_parses_and_dispatches(monkeypatch):
    """Exercises the real json.loads(payload) + handler path (guards the missing
    `import json` regression)."""
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_x")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "svc_x")
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    import stripe
    monkeypatch.setattr(stripe.Webhook, "construct_event", staticmethod(lambda payload, sig, secret: {"ok": True}))
    seen = {}
    monkeypatch.setattr("app.main.handle_stripe_event", lambda ev: seen.update(ev))
    client = TestClient(app)
    res = client.post("/api/stripe/webhook",
                      content=b'{"type":"checkout.session.completed","data":{"object":{}}}',
                      headers={"stripe-signature": "t=1,v1=x"})
    assert res.status_code == 200
    assert res.json() == {"received": True}
    assert seen.get("type") == "checkout.session.completed"


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


def test_handle_checkout_subscription_uses_item_period_end(monkeypatch):
    captured = {}

    def fake_grant(user_id, plan, expires_at, customer_id=None, subscription_id=None, status="active"):
        captured.update(user_id=user_id, plan=plan, expires_at=expires_at, subscription_id=subscription_id)

    # Subscription.retrieve returns an object with period end only on the item
    class _Sub:
        def to_dict(self):
            return {"items": {"data": [{"current_period_end": 4102444800}]}}  # 2100-01-01

    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_x")
    monkeypatch.setattr(entitlement_service, "grant_entitlement", fake_grant)
    import stripe
    monkeypatch.setattr(stripe.Subscription, "retrieve", staticmethod(lambda sid: _Sub()))
    event = {
        "type": "checkout.session.completed",
        "data": {"object": {
            "mode": "subscription",
            "client_reference_id": "user-7",
            "metadata": {"plan": "maxx", "user_id": "user-7"},
            "customer": "cus_2",
            "subscription": "sub_2",
        }},
    }
    entitlement_service.handle_stripe_event(event)
    assert captured["user_id"] == "user-7"
    assert captured["plan"] == "maxx"
    assert captured["subscription_id"] == "sub_2"
    assert captured["expires_at"].year == 2100


def test_handle_checkout_without_user_is_noop(monkeypatch):
    called = {"n": 0}
    monkeypatch.setattr(entitlement_service, "grant_entitlement", lambda *a, **k: called.__setitem__("n", called["n"] + 1))
    event = {"type": "checkout.session.completed", "data": {"object": {"mode": "payment", "metadata": {}}}}
    entitlement_service.handle_stripe_event(event)
    assert called["n"] == 0
