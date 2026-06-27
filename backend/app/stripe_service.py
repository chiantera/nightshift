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


def create_maxx_checkout_session(customer_email: str | None = None) -> str:
    """Create a subscription Checkout Session for Maxx and return its hosted URL."""
    import stripe

    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    base = os.environ.get("APP_BASE_URL", _DEFAULT_APP_BASE_URL).rstrip("/")
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": os.environ["STRIPE_MAXX_PRICE_ID"], "quantity": 1}],
        success_url=f"{base}/?maxx=success&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{base}/?maxx=cancel",
        customer_email=customer_email or None,
        allow_promotion_codes=True,
    )
    return session.url
