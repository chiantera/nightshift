"""Provider fallback chain: DeepSeek → Mistral → z.ai → Anthropic."""
import pytest

from app import ai_service


@pytest.fixture(autouse=True)
def _clear_provider_keys(monkeypatch):
    for env in ("DEEPSEEK_API_KEY", "MISTRAL_API_KEY", "ZAI_API_KEY", "ANTHROPIC_API_KEY"):
        monkeypatch.delenv(env, raising=False)


def test_active_providers_order_and_gating(monkeypatch):
    monkeypatch.setenv("DEEPSEEK_API_KEY", "x")
    monkeypatch.setenv("ZAI_API_KEY", "x")
    # mistral + anthropic keys absent → excluded
    names = [p["name"] for p in ai_service._active_providers()]
    assert names == ["deepseek", "zai"]


def test_no_providers_raises(monkeypatch):
    with pytest.raises(RuntimeError, match="Nessun provider AI"):
        ai_service._complete_with_fallback("flash", "sys", "user", 100)


def test_per_provider_models_and_overrides(monkeypatch):
    monkeypatch.setenv("MISTRAL_API_KEY", "x")
    mistral = next(p for p in ai_service._PROVIDER_CHAIN if p["name"] == "mistral")
    assert ai_service._provider_model(mistral, "flash") == "mistral-small-latest"
    assert ai_service._provider_model(mistral, "pro") == "mistral-large-latest"
    monkeypatch.setenv("MISTRAL_PRO_MODEL", "mistral-medium-latest")
    assert ai_service._provider_model(mistral, "pro") == "mistral-medium-latest"


def test_fallback_skips_failing_provider(monkeypatch):
    # DeepSeek (first) fails, z.ai (next) succeeds → its model is returned.
    monkeypatch.setenv("DEEPSEEK_API_KEY", "x")
    monkeypatch.setenv("ZAI_API_KEY", "x")
    calls: list[str] = []

    def fake_openai_complete(provider, model, system, user, max_tokens):
        calls.append(provider["name"])
        if provider["name"] == "deepseek":
            raise RuntimeError("deepseek down")
        return "{}", {"input": 5, "output": 7}, "stop"

    monkeypatch.setattr(ai_service, "_openai_complete", fake_openai_complete)
    raw, usage, finish, model = ai_service._complete_with_fallback("flash", "sys", "u", 100)
    assert calls == ["deepseek", "zai"]
    assert model == "glm-4.5-flash"
    assert usage == {"input": 5, "output": 7}


def test_all_providers_failing_raises(monkeypatch):
    monkeypatch.setenv("DEEPSEEK_API_KEY", "x")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "x")

    def boom_openai(*a, **k):
        raise RuntimeError("nope")

    def boom_anthropic(*a, **k):
        raise RuntimeError("nope")

    monkeypatch.setattr(ai_service, "_openai_complete", boom_openai)
    monkeypatch.setattr(ai_service, "_anthropic_complete", boom_anthropic)
    with pytest.raises(RuntimeError, match="Tutti i provider AI hanno fallito"):
        ai_service._complete_with_fallback("flash", "sys", "u", 100)
