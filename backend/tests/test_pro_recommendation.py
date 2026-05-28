from app.ai_service import _analysis_prompt_policy, _build_pro_recommendation
from app.models import (
    Appuntamento,
    CaseAnalysis,
    Contradiction,
    MissingDocument,
    ProRecommendation,
    UsageEstimate,
)


def minimal_case(**overrides) -> CaseAnalysis:
    data = {
        "case_id": "rossi",
        "case_title": "Rossi",
        "language": "it",
        "case_summary": "Sintesi",
        "materials": [],
        "timeline": [],
        "people": [],
        "evidence": [],
        "open_questions": [],
        "missing_documents": [],
        "contradictions": [],
        "procedural_deadlines": [],
        "brief_markdown": "",
        "usage_estimate": UsageEstimate(),
        "analisi_progressi": None,
    }
    data.update(overrides)
    return CaseAnalysis(**data)


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


def test_pro_recommendation_collects_triggers_without_auto_charging():
    case = minimal_case(
        contradictions=[Contradiction(title="Plateau persistente", description="Il cliente non supera 80 kg da 6 settimane.")],
        missing_documents=[MissingDocument(title="Referto fisioterapista", reason="Necessario prima di aumentare carichi", priority="alta")],
        procedural_deadlines=[Appuntamento(title="Sessione test", due_date="", deadline_type="sessione_pt", status="candidate", urgency="alta")],
    )

    rec = _build_pro_recommendation(case, mode="flash")

    assert isinstance(rec, ProRecommendation)
    assert rec.recommended is True
    assert rec.requires_confirmation is True
    assert rec.auto_charge is False
    assert rec.cta_label == "Analisi Approfondita con Aria"
    assert rec.alternate_label == "Continua con analisi standard"
    assert "plateau o incongruenze" in rec.message
    assert "appuntamento da confermare" in rec.message
    assert "informazioni mancanti" in rec.message
    assert set(rec.reasons) >= {"contradictions", "candidate_deadline", "missing_key_document"}


def test_pro_recommendation_not_emitted_after_pro_run():
    case = minimal_case(contradictions=[Contradiction(title="Plateau", description="Stallo")])

    rec = _build_pro_recommendation(case, mode="pro")

    assert rec.recommended is False
    assert rec.reasons == []
    assert rec.auto_charge is False
