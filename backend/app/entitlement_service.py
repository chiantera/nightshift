"""Maxx membership / entitlement store (Supabase `maxx_members`) + Stripe webhook.

Reads (frontend status) use the caller's token + RLS. Writes (from the Stripe
webhook, which has no user JWT) use the Supabase service-role key, so the webhook
must be configured with STRIPE_WEBHOOK_SECRET + SUPABASE_SERVICE_ROLE_KEY.

A daypass grants 24h; a subscription grants until current_period_end.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

import httpx

_TIMEOUT = 15
DAYPASS_HOURS = 24


def _supabase_base() -> str:
    return os.environ["SUPABASE_URL"].rstrip("/")


def webhook_configured() -> bool:
    return bool(
        os.environ.get("STRIPE_WEBHOOK_SECRET")
        and os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        and os.environ.get("SUPABASE_URL")
    )


# ── Reads (user token, RLS) ─────────────────────────────────────────────────────

def get_membership(user_token: str) -> dict:
    """Return {active, plan, expires_at} for the caller. active=False if no row,
    not active, or expired."""
    try:
        r = httpx.get(
            f"{_supabase_base()}/rest/v1/maxx_members?select=plan,status,expires_at",
            headers={"apikey": os.environ["SUPABASE_ANON_KEY"], "Authorization": f"Bearer {user_token}"},
            timeout=_TIMEOUT,
        )
    except httpx.HTTPError:
        return {"active": False}
    if r.status_code != 200 or not r.json():
        return {"active": False}
    m = r.json()[0]
    active = m.get("status") == "active"
    exp = m.get("expires_at")
    if active and exp:
        try:
            active = datetime.fromisoformat(exp.replace("Z", "+00:00")) > datetime.now(timezone.utc)
        except ValueError:
            pass
    return {"active": bool(active), "plan": m.get("plan"), "expires_at": exp}


# ── Writes (service-role, from the webhook) ─────────────────────────────────────

def _service_headers() -> dict[str, str]:
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def grant_entitlement(user_id: str, plan: str, expires_at: datetime | None,
                      customer_id: str | None = None, subscription_id: str | None = None,
                      status: str = "active") -> None:
    row = {
        "user_id": user_id,
        "plan": plan,
        "status": status,
        "expires_at": expires_at.isoformat() if expires_at else None,
        "stripe_customer_id": customer_id,
        "stripe_subscription_id": subscription_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    httpx.post(
        f"{_supabase_base()}/rest/v1/maxx_members?on_conflict=user_id",
        headers={**_service_headers(), "Prefer": "resolution=merge-duplicates"},
        json=row,
        timeout=_TIMEOUT,
    )


def update_by_subscription(subscription_id: str, status: str, expires_at: datetime | None) -> None:
    httpx.patch(
        f"{_supabase_base()}/rest/v1/maxx_members?stripe_subscription_id=eq.{subscription_id}",
        headers=_service_headers(),
        json={
            "status": status,
            "expires_at": expires_at.isoformat() if expires_at else None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        timeout=_TIMEOUT,
    )


# ── Stripe event handling ───────────────────────────────────────────────────────

def handle_stripe_event(event: dict) -> None:
    """Apply a verified Stripe event to the membership store."""
    import stripe

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type == "checkout.session.completed":
        user_id = obj.get("client_reference_id") or (obj.get("metadata") or {}).get("user_id")
        if not user_id:
            return
        customer = obj.get("customer")
        if obj.get("mode") == "subscription":
            sub_id = obj.get("subscription")
            expires = None
            if sub_id:
                stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
                sub = stripe.Subscription.retrieve(sub_id)
                cpe = sub.get("current_period_end")
                expires = datetime.fromtimestamp(cpe, tz=timezone.utc) if cpe else None
            grant_entitlement(user_id, "maxx", expires, customer, sub_id)
        else:  # one-off payment → daypass
            expires = datetime.now(timezone.utc) + timedelta(hours=DAYPASS_HOURS)
            grant_entitlement(user_id, "daypass", expires, customer)

    elif event_type in ("customer.subscription.updated", "customer.subscription.deleted"):
        sub_id = obj.get("id")
        deleted = event_type == "customer.subscription.deleted"
        active = (not deleted) and obj.get("status") in ("active", "trialing")
        cpe = obj.get("current_period_end")
        expires = datetime.fromtimestamp(cpe, tz=timezone.utc) if cpe else None
        update_by_subscription(sub_id, "active" if active else "canceled", expires)
