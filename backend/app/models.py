from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SourceRef(BaseModel):
    source_name: str = ""
    page: int | None = None
    chunk: str | None = None
    quote: str = ""
    confidence: float = Field(default=0.5, ge=0, le=1)


class Material(BaseModel):
    id: str = ""
    name: str = ""
    kind: Literal["text", "pdf", "image", "audio"] = "text"
    description: str = ""
    excerpt: str = ""
    content: str = ""


class TimelineEvent(BaseModel):
    date: str | None = None
    time: str | None = None
    title: str = ""
    description: str = ""
    tipo_sessione: str | None = None
    source_refs: list[SourceRef] = []
    confidence: float = Field(default=0.5, ge=0, le=1)

    @model_validator(mode="before")
    @classmethod
    def _null_required_strings(cls, data: dict) -> dict:
        for field in ("title", "description"):
            if field in data and data[field] is None:
                data[field] = ""
        return data


class Person(BaseModel):
    name: str = ""
    role: str = ""
    notes: str = ""
    source_refs: list[SourceRef] = []

    @model_validator(mode="before")
    @classmethod
    def _null_required_strings(cls, data: dict) -> dict:
        for field in ("name", "role", "notes"):
            if field in data and data[field] is None:
                data[field] = ""
        return data


class EvidenceItem(BaseModel):
    title: str = ""
    status: str = ""
    notes: str = ""
    source_refs: list[SourceRef] = []

    @model_validator(mode="before")
    @classmethod
    def _null_required_strings(cls, data: dict) -> dict:
        for field in ("title", "status", "notes"):
            if field in data and data[field] is None:
                data[field] = ""
        return data


class OpenQuestion(BaseModel):
    question: str = ""
    why_it_matters: str = ""
    source_refs: list[SourceRef] = []


class MissingDocument(BaseModel):
    title: str = ""
    reason: str = ""
    priority: Literal["alta", "media", "bassa"] = "media"


class Contradiction(BaseModel):
    title: str = ""
    description: str = ""
    source_refs: list[SourceRef] = []


class Appuntamento(BaseModel):
    title: str = ""
    deadline_type: Literal["sessione_pt", "check_in", "gara", "visita_medica", "altro"] = "altro"
    due_date: str = ""
    due_time: str | None = None
    status: Literal["confirmed", "candidate", "needs_review"] = "needs_review"
    urgency: Literal["alta", "media", "bassa"] = "media"
    description: str = ""
    source_refs: list[SourceRef] = []
    tasks: list[str] = []

    @model_validator(mode="before")
    @classmethod
    def _null_required_strings(cls, data: dict) -> dict:
        for field in ("title", "due_date", "description"):
            if field in data and data[field] is None:
                data[field] = ""
        return data


class UsageEstimate(BaseModel):
    pages: int = 0
    audio_minutes: int = 0
    flash_input_tokens: int = 0
    flash_output_tokens: int = 0
    pro_used: bool = False
    model_route: str = "unknown"


class ProRecommendation(BaseModel):
    """Non-binding upgrade prompt. It must never trigger billing by itself."""
    recommended: bool = False
    reasons: list[str] = []
    message: str = ""
    cta_label: str = "Avvia Analisi Pro"
    alternate_label: str = "Continua con analisi standard"
    requires_confirmation: bool = True
    auto_charge: bool = False


# ── Fitness analysis models ───────────────────────────────────────────────────

class StepObiettivo(BaseModel):
    element: str = ""
    description: str = ""
    status: Literal["raggiunto", "in_corso", "plateau", "non_avviato"] = "in_corso"
    notes: str = ""
    source_refs: list[SourceRef] = []

    @model_validator(mode="before")
    @classmethod
    def _null_required_strings(cls, data: dict) -> dict:
        for field in ("element", "description", "notes"):
            if field in data and data[field] is None:
                data[field] = ""
        return data


class Obiettivo(BaseModel):
    obiettivo_code: str = ""
    obiettivo_nome: str = ""
    scadenza_target: str = ""
    step_obiettivo: list[StepObiettivo] = []
    strategie: list[str] = []
    progresso_score: float = Field(default=0.5, ge=0, le=1)
    notes: str = ""
    source_refs: list[SourceRef] = []

    @model_validator(mode="before")
    @classmethod
    def _null_required_strings(cls, data: dict) -> dict:
        for field in ("obiettivo_code", "obiettivo_nome", "scadenza_target", "notes"):
            if field in data and data[field] is None:
                data[field] = ""
        return data


class ApproccioAllenamento(BaseModel):
    title: str = ""
    obiettivo_ref: str | None = None
    tipo: str = "altro"
    priority: Literal["primary", "secondary", "fallback"] = "secondary"
    description: str = ""
    strengths: list[str] = []
    risks: list[str] = []
    dati_necessari: list[str] = []
    source_refs: list[SourceRef] = []


class LimitazioneFisica(BaseModel):
    title: str = ""
    issue_type: str = "limitazione_tecnica"
    severity: Literal["critical", "significant", "minor"] = "minor"
    description: str = ""
    fonte: str = ""
    raccomandazione: str = ""
    source_refs: list[SourceRef] = []


class ValutazioneAderenza(BaseModel):
    nome: str = ""
    role: Literal["cliente", "medico", "fisioterapista", "nutrizionista", "expert"] = "cliente"
    affidabilita_score: float = Field(default=0.5, ge=0, le=1)
    dichiarazione_chiave: str = ""
    strengths: list[str] = []
    vulnerabilities: list[str] = []
    domande_approfondimento: list[str] = []
    source_refs: list[SourceRef] = []


class BilancioProgressi(BaseModel):
    progresso_score: float = Field(default=0.5, ge=0, le=1)
    autonomia_score: float = Field(default=0.5, ge=0, le=1)
    progressi_chiave: list[str] = []
    fattori_favorevoli: list[str] = []
    critical_gaps: list[str] = []
    valutazione_generale: str = ""


class AnalisiProgressi(BaseModel):
    livello_attenzione: Literal["low", "medium", "high", "critical"] = "medium"
    sommario: str = ""
    azioni_immediate: list[str] = []
    obiettivi: list[Obiettivo] = []
    approcci: list[ApproccioAllenamento] = []
    limitazioni_fisiche: list[LimitazioneFisica] = []
    valutazioni_aderenza: list[ValutazioneAderenza] = []
    bilancio: BilancioProgressi | None = None
    nota_cliente: str = ""


# ── Summary model ─────────────────────────────────────────────────────────────

class CaseSummary(BaseModel):
    case_id: str
    case_title: str
    client_name: str
    case_summary: str
    obiettivi_summary: str
    next_deadline_date: str | None
    next_deadline_title: str | None
    contradiction_count: int
    material_count: int
    risk_level: Literal["low", "medium", "high", "critical"] | None
    status: Literal["active", "closed", "archived"] = "active"
    created_at: str


# ── Root case model ───────────────────────────────────────────────────────────

class CaseAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    case_id: str
    case_title: str
    language: Literal["it", "en"] = "it"
    case_summary: str
    materials: list[Material]
    timeline: list[TimelineEvent]
    people: list[Person]
    evidence: list[EvidenceItem]
    open_questions: list[OpenQuestion]
    missing_documents: list[MissingDocument]
    contradictions: list[Contradiction]
    procedural_deadlines: list[Appuntamento]
    brief_markdown: str
    usage_estimate: UsageEstimate
    pro_recommendation: ProRecommendation = ProRecommendation()
    analisi_progressi: AnalisiProgressi | None = None

    @model_validator(mode="before")
    @classmethod
    def _null_lists_to_empty(cls, data: dict) -> dict:
        list_fields = ["materials", "timeline", "people", "evidence", "open_questions",
                       "missing_documents", "contradictions", "procedural_deadlines"]
        for field in list_fields:
            if field in data and data[field] is None:
                data[field] = []
        return data

    @model_validator(mode="before")
    @classmethod
    def _null_strings_to_empty(cls, data: dict) -> dict:
        for field in ("case_summary", "brief_markdown"):
            if field in data and data[field] is None:
                data[field] = ""
        return data


# ── Request / response for AI analysis ───────────────────────────────────────

class FetchUrlRequest(BaseModel):
    url: str
    name: str = ""


class AnalyzeMaterialInput(BaseModel):
    name: str
    kind: Literal["text", "pdf", "image", "audio"]
    text: str
    category: Literal["scheda", "documento_medico"] = "scheda"


class AnalyzeRequest(BaseModel):
    case_title: str
    materials: list[AnalyzeMaterialInput]
    mode: Literal["flash", "pro"] = "flash"
    language: Literal["it", "en"] = "it"
    # Optional free-text steering instructions written by the trainer at summon
    # time. Woven into the prompt but never overrides the no-inventing guardrails.
    user_instructions: str | None = None


class AnalyzeJobCreated(BaseModel):
    """Returned immediately when an analysis job is accepted."""
    job_id: str
    status: Literal["running"] = "running"


class AnalyzeJobStatus(BaseModel):
    """Polled by the client until the background analysis finishes."""
    status: Literal["running", "done", "error"]
    result: CaseAnalysis | None = None
    error: str | None = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    system_override: str | None = None
    mode: Literal["flash", "pro"] = "flash"
    language: Literal["it", "en"] = "it"
