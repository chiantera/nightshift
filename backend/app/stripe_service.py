"""Stripe Checkout for the Maxx subscription.

Gated on env, like the AI provider chain: the /api/checkout endpoint is only
functional when both STRIPE_SECRET_KEY and STRIPE_MAXX_PRICE_ID are set. Until
then the frontend CTA falls back to its placeholder note.

Required env:
- STRIPE_SECRET_KEY     — sk_live_… / sk_test_…
- STRIPE_MAXX_PRICE_ID  — price_… for the recurring €19/mo Maxx plan
Optional:
- APP_BASE_URL          — return base for success/cancel (default prod domain)
"""
from __future__ import annotations

import os

_DEFAULT_APP_BASE_URL = "https://nightshift-ruby.vercel.app"


def stripe_configured() -> bool:
    """True only when both the secret key and the Maxx price ID are present."""
    return bool(os.environ.get("STRIPE_SECRET_KEY") and os.environ.get("STRIPE_MAXX_PRICE_ID"))


# Maxx plans. "maxx" = €19/mo subscription. "daypass" = €1 one-time, meant to
# grant 24h of Maxx (NOTE: the 24h entitlement is NOT enforced yet — needs the
# webhook + entitlement store; for now this only runs the payment flow).
_PLANS: dict[str, dict[str, str]] = {
    "maxx": {"mode": "subscription", "price_env": "STRIPE_MAXX_PRICE_ID"},
    "daypass": {"mode": "payment", "price_env": "STRIPE_MAXX_DAYPASS_PRICE_ID"},
}


def _plan_config(plan: str) -> tuple[str, str]:
    """Return (mode, price_id) for a plan, falling back to the standard Maxx plan."""
    cfg = _PLANS.get(plan, _PLANS["maxx"])
    price_id = os.environ.get(cfg["price_env"]) or os.environ["STRIPE_MAXX_PRICE_ID"]
    mode = cfg["mode"] if os.environ.get(cfg["price_env"]) else "subscription"
    return mode, price_id


def create_maxx_checkout_session(plan: str = "maxx", customer_email: str | None = None) -> str:
    """Create a Checkout Session for the given Maxx plan and return its hosted URL."""
    import stripe

    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    base = os.environ.get("APP_BASE_URL", _DEFAULT_APP_BASE_URL).rstrip("/")
    mode, price_id = _plan_config(plan)
    session = stripe.checkout.Session.create(
        mode=mode,
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{base}/?maxx=success&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{base}/?maxx=cancel",
        customer_email=customer_email or None,
        allow_promotion_codes=True,
    )
    return session.url
