from pathlib import Path


FRONTEND = Path(__file__).resolve().parents[2] / "frontend" / "src" / "main.tsx"
STYLES = Path(__file__).resolve().parents[2] / "frontend" / "src" / "styles.css"


def test_mobile_navigation_uses_product_language_not_raw_model_names():
    source = FRONTEND.read_text()

    # No raw DeepSeek model names exposed to users
    assert "deepseek-v4-flash" not in source

    # Fitness-domain identifiers present
    assert "AriaPromptBar" in source
    assert "AnalisiProgressi" in source
    assert "analisi_progressi" in source
    assert "obiettivi_summary" in source

    # Risk level helpers present
    assert "riskColor" in source
    assert "riskLabel" in source


def test_dashboard_cards_and_navigation_links_are_wired():
    source = FRONTEND.read_text()
    styles = STYLES.read_text()

    # Component references wired
    assert "CaseListView" in source
    assert "CaseDetailView" in source

    # Upload flow present
    assert "MultiFileUploadDrawer" in source

    # Key CSS classes
    assert ".case-card" in styles
    assert ".aria-prompt-bar" in styles
