from app.ai_service import _analysis_prompt_policy


def test_flash_prompt_policy_extracts_without_strategy():
    policy = _analysis_prompt_policy("flash")

    assert "non sovra-interpretare" in policy
    assert "marca come candidate" in policy
    assert "Non inventare dati di progressi" in policy
    assert "REGOLA ASSOLUTA" not in policy


def test_pro_prompt_policy_demands_deep_source_linked_reasoning():
    policy = _analysis_prompt_policy("pro")

    assert "Analizza in profondità" in policy
    assert "Identifica plateau" in policy
    assert "Collega ogni affermazione alla fonte specifica" in policy
    assert "REGOLA ASSOLUTA" in policy
    assert "dato non disponibile" in policy
