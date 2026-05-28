from fastapi.testclient import TestClient

from app.main import app


def test_demo_case_is_fitness_and_italian():
    client = TestClient(app)

    response = client.get("/api/demo-case")

    assert response.status_code == 200
    payload = response.json()
    assert payload["case_title"] == "Marco Bianchi"
    assert "massa" in payload["case_summary"].lower() or "35 anni" in payload["case_summary"]
    assert payload["language"] == "it"


def test_demo_case_has_fitness_materials_and_timeline():
    client = TestClient(app)

    payload = client.get("/api/demo-case").json()

    assert len(payload["materials"]) >= 2
    material_names = {item["name"] for item in payload["materials"]}
    assert any("anamnesi" in n.lower() or "log" in n.lower() for n in material_names)

    assert len(payload["timeline"]) >= 4
    first_event = payload["timeline"][0]
    assert first_event["date"] == "2026-03-03"
    assert first_event["source_refs"]
    assert first_event["source_refs"][0]["quote"]

    assert any("plateau" in item["title"].lower() or "massa" in item["title"].lower()
               for item in payload["contradictions"])
    assert len(payload["brief_markdown"]) > 100


def test_usage_estimate_exposes_flash_first_model_route():
    client = TestClient(app)

    payload = client.get("/api/demo-case").json()
    usage = payload["usage_estimate"]

    assert usage["model_route"]
    assert usage["pro_used"] is False
    assert usage["pages"] >= 1
    assert usage["flash_input_tokens"] > 0
    assert usage["flash_output_tokens"] > 0


def test_demo_case_exposes_fitness_deadlines():
    client = TestClient(app)

    payload = client.get("/api/demo-case").json()
    deadlines = payload["procedural_deadlines"]

    assert len(deadlines) >= 2
    first = deadlines[0]
    assert first["deadline_type"] in ("sessione_pt", "check_in", "gara", "visita_medica", "altro")
    assert first["due_date"]

    types = {d["deadline_type"] for d in deadlines}
    assert "sessione_pt" in types


def test_demo_case_has_analisi_progressi():
    client = TestClient(app)

    payload = client.get("/api/demo-case").json()
    assert payload["analisi_progressi"] is not None
    ap = payload["analisi_progressi"]
    assert ap["livello_attenzione"] in ("low", "medium", "high", "critical")
    assert len(ap["obiettivi"]) >= 1
    assert ap["sommario"]
    assert ap["nota_cliente"]


def test_cases_list_endpoint_returns_summaries():
    client = TestClient(app)

    response = client.get("/api/cases")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) >= 2
    for case in cases:
        assert "case_id" in case
        assert "case_title" in case
        assert "risk_level" in case
        assert "obiettivi_summary" in case


def test_case_detail_endpoint_returns_analisi_progressi():
    client = TestClient(app)

    response = client.get("/api/cases/marco-bianchi")
    assert response.status_code == 200
    payload = response.json()
    assert payload["analisi_progressi"] is not None
    ap = payload["analisi_progressi"]
    assert ap["livello_attenzione"] in ("low", "medium", "high", "critical")
    assert len(ap["obiettivi"]) >= 1
    assert len(ap["approcci"]) >= 1
    assert len(ap["azioni_immediate"]) >= 1
    assert ap["bilancio"]["progresso_score"] >= 0
    assert ap["nota_cliente"]
