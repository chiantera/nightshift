from app.ai_service import _build_analysis_user_message, _truncate_materials
from app.models import AnalyzeMaterialInput, AnalyzeRequest


def _request(**overrides) -> AnalyzeRequest:
    data = {
        "case_title": "Marco",
        "materials": [AnalyzeMaterialInput(name="Sessione 1", kind="text", text="panca 60kg 3x10")],
        "mode": "flash",
        "language": "it",
    }
    data.update(overrides)
    return AnalyzeRequest(**data)


def _prompt(request: AnalyzeRequest) -> str:
    return _build_analysis_user_message(_truncate_materials(request.materials, 100_000), request)


def test_analyze_request_accepts_optional_user_instructions():
    req = _request(user_instructions="Concentrati sui plateau di forza.")
    assert req.user_instructions == "Concentrati sui plateau di forza."
    # Default stays None when the field is omitted.
    assert _request().user_instructions is None


def test_trainer_instructions_are_woven_into_the_prompt():
    prompt = _prompt(_request(user_instructions="Concentrati sui plateau di forza, ignora il cardio."))
    assert "ISTRUZIONI DEL TRAINER" in prompt
    assert "Concentrati sui plateau di forza, ignora il cardio." in prompt
    # The no-inventing guardrail still survives below the trainer block.
    assert "REGOLA ASSOLUTA: non inventare" in prompt


def test_no_trainer_block_when_instructions_absent_or_blank():
    assert "ISTRUZIONI DEL TRAINER" not in _prompt(_request())
    assert "ISTRUZIONI DEL TRAINER" not in _prompt(_request(user_instructions="   "))
