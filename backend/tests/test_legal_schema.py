from app.models import Appuntamento, ApproccioAllenamento, CaseAnalysis


def test_appuntamento_default_deadline_type_is_altro():
    appt = Appuntamento(title="Sessione prova")

    assert appt.deadline_type == "altro"
    assert appt.model_dump()["deadline_type"] == "altro"


def test_approccio_allenamento_can_link_to_specific_obiettivo():
    approccio = ApproccioAllenamento(
        title="Periodizzazione ondulata",
        obiettivo_ref="OBJ-1",
        tipo="periodizzazione",
        priority="primary",
        description="Alterna settimane forza e ipertrofia.",
        strengths=[],
        risks=[],
        dati_necessari=[],
    )

    assert approccio.obiettivo_ref == "OBJ-1"


def test_null_strings_in_nested_models_are_coerced_to_empty():
    """DeepSeek often emits null for optional-looking string fields inside
    nested objects.  CaseAnalysis should convert those to empty strings
    so Pydantic validation passes."""
    raw = {
        "case_id": "test-null-fix",
        "case_title": "Test",
        "language": "it",
        "case_summary": None,
        "materials": [],
        "timeline": [
            {
                "title": None,
                "description": "Sessione",
                "source_refs": [],
                "confidence": 0.8,
            }
        ],
        "people": [],
        "evidence": [],
        "open_questions": [],
        "missing_documents": [],
        "contradictions": [],
        "procedural_deadlines": [
            {
                "title": "Sessione PT",
                "due_date": None,
                "description": None,
                "source_refs": [],
            }
        ],
        "brief_markdown": None,
        "usage_estimate": {},
        "analisi_progressi": None,
    }

    case = CaseAnalysis.model_validate(raw)

    assert case.case_summary == ""
    assert case.brief_markdown == ""
    assert case.timeline[0].title == ""
    assert case.procedural_deadlines[0].due_date == ""
    assert case.procedural_deadlines[0].description == ""


def test_appuntamento_nulls_coerced():
    """Direct test: Appuntamento converts null required strings to empty."""
    d = Appuntamento(title=None, due_date=None, description=None)
    assert d.title == ""
    assert d.due_date == ""
    assert d.description == ""
