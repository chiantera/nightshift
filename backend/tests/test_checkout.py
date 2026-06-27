"""Maxx Stripe checkout endpoint — gated on env config."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app import stripe_service


@pytest.fixture(autouse=True)
def _clear_stripe_env(monkeypatch):
    monkeypatch.delenv("STRIPE_SECRET_KEY", raising=False)
    monkeypatch.delenv("STRIPE_MAXX_PRICE_ID", raising=False)


def test_stripe_configured_requires_both(monkeypatch):
    assert stripe_service.stripe_configured() is False
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_x")
    assert stripe_service.stripe_configured() is False  # price id still missing
    monkeypatch.setenv("STRIPE_MAXX_PRICE_ID", "price_x")
    assert stripe_service.stripe_configured() is True


def test_checkout_returns_503_when_unconfigured():
    client = TestClient(app)
    res = client.post("/api/checkout", json={})
    assert res.status_code == 503


def test_checkout_returns_url_when_configured(monkeypatch):
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_x")
    monkeypatch.setenv("STRIPE_MAXX_PRICE_ID", "price_x")
    monkeypatch.setattr(
        "app.main.create_maxx_checkout_session",
        lambda email=None: "https://checkout.stripe.com/c/pay/test_session",
    )
    client = TestClient(app)
    res = client.post("/api/checkout", json={})
    assert res.status_code == 200
    assert res.json()["url"].startswith("https://checkout.stripe.com/")
