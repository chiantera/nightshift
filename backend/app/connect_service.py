"""Stripe Connect (Express) onboarding for trainers collecting from their clients.

Gated on env, like the rest of the payment stack: the /api/connect/* endpoints
return 503 until configured.

Model: SchedaPRO is the platform; each trainer gets an Express connected account.
The trainer→account_id map is persisted in Supabase (`public.trainer_connect`,
RLS-scoped to the user). All Supabase calls are made WITH the caller's access
token so RLS enforces per-user isolation (no service-role secret needed).

Required env:
- STRIPE_SECRET_KEY
- SUPABASE_URL, SUPABASE_ANON_KEY
Optional:
- APP_BASE_URL  — return/refresh base for the onboarding link (default prod domain)
"""
from __future__ import annotations

import os

import httpx

_DEFAULT_APP_BASE_URL = "https://nightshift-ruby.vercel.app"
_TIMEOUT = 15


def connect_configured() -> bool:
    return bool(
        os.environ.get("STRIPE_SECRET_KEY")
        and os.environ.get("SUPABASE_URL")
        and os.environ.get("SUPABASE_ANON_KEY")
    )


def _supabase_base() -> str:
    return os.environ["SUPABASE_URL"].rstrip("/")


def _rest_headers(user_token: str) -> dict[str, str]:
    return {
        "apikey": os.environ["SUPABASE_ANON_KEY"],
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json",
    }


def get_user_id(user_token: str) -> str | None:
    """Validate the Supabase access token and return the user id, or None."""
    if not user_token:
        return None
    try:
        r = httpx.get(
            f"{_supabase_base()}/auth/v1/user",
            headers={"apikey": os.environ["SUPABASE_ANON_KEY"], "Authorization": f"Bearer {user_token}"},
            timeout=_TIMEOUT,
        )
    except httpx.HTTPError:
        return None
    if r.status_code != 200:
        return None
    return r.json().get("id")


def _get_row(user_token: str) -> dict | None:
    r = httpx.get(
        f"{_supabase_base()}/rest/v1/trainer_connect?select=stripe_account_id,charges_enabled",
        headers=_rest_headers(user_token),
        timeout=_TIMEOUT,
    )
    if r.status_code != 200:
        return None
    rows = r.json()
    return rows[0] if rows else None


def _upsert_account_id(user_token: str, account_id: str) -> None:
    headers = {**_rest_headers(user_token), "Prefer": "resolution=merge-duplicates"}
    httpx.post(
        f"{_supabase_base()}/rest/v1/trainer_connect?on_conflict=user_id",
        headers=headers,
        json={"stripe_account_id": account_id},
        timeout=_TIMEOUT,
    )


def _update_charges(user_token: str, charges_enabled: bool) -> None:
    httpx.patch(
        f"{_supabase_base()}/rest/v1/trainer_connect",
        headers=_rest_headers(user_token),
        json={"charges_enabled": charges_enabled, "updated_at": "now()"},
        timeout=_TIMEOUT,
    )


def get_or_create_account(user_token: str) -> str:
    """Return the trainer's connected account id, creating an Express account if needed."""
    import stripe

    row = _get_row(user_token)
    if row and row.get("stripe_account_id"):
        return row["stripe_account_id"]

    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    account = stripe.Account.create(
        type="express",
        country="IT",
        capabilities={
            "card_payments": {"requested": True},
            "transfers": {"requested": True},
            "sepa_debit_payments": {"requested": True},
        },
    )
    _upsert_account_id(user_token, account.id)
    return account.id


def create_onboarding_link(account_id: str) -> str:
    """Create a Stripe Account Link for hosted Express onboarding."""
    import stripe

    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    base = os.environ.get("APP_BASE_URL", _DEFAULT_APP_BASE_URL).rstrip("/")
    link = stripe.AccountLink.create(
        account=account_id,
        refresh_url=f"{base}/?payments=refresh",
        return_url=f"{base}/?payments=return",
        type="account_onboarding",
    )
    return link.url


def create_payment_session(user_token: str, amount_cents: int, description: str, client_email: str | None = None) -> str:
    """Create a one-off Checkout Session ON the trainer's connected account.

    Direct charge: the session is created with the connected account context
    (`stripe_account`); the platform takes a 1% application fee. Returns the
    hosted payment URL the trainer can share with the client.
    """
    import stripe

    row = _get_row(user_token)
    if not row or not row.get("stripe_account_id"):
        raise RuntimeError("not_onboarded")
    account_id = row["stripe_account_id"]

    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    base = os.environ.get("APP_BASE_URL", _DEFAULT_APP_BASE_URL).rstrip("/")
    fee = max(1, round(amount_cents * 0.01))  # 1% platform fee
    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "eur",
                "unit_amount": amount_cents,
                "product_data": {"name": description},
            },
            "quantity": 1,
        }],
        payment_intent_data={"application_fee_amount": fee},
        success_url=f"{base}/?payments=paid",
        cancel_url=f"{base}/?payments=cancel",
        customer_email=client_email or None,
        stripe_account=account_id,
    )
    return session.url


def get_status(user_token: str) -> dict:
    """Return {onboarded, charges_enabled} for the trainer, syncing from Stripe."""
    import stripe

    row = _get_row(user_token)
    if not row or not row.get("stripe_account_id"):
        return {"onboarded": False, "charges_enabled": False}

    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    account = stripe.Account.retrieve(row["stripe_account_id"])
    charges = bool(account.charges_enabled)
    if charges != bool(row.get("charges_enabled")):
        _update_charges(user_token, charges)
    return {"onboarded": True, "charges_enabled": charges}
