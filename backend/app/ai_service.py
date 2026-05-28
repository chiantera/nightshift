from __future__ import annotations

import json
import logging
import os
import re
import sys
from collections.abc import Generator

from .models import (
    AnalyzeRequest,
    CaseAnalysis,
    ChatRequest,
    ProRecommendation,
)

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger(__name__)

# ── Provider selection ────────────────────────────────────────────────────────
# Set DEEPSEEK_API_KEY to use DeepSeek (OpenAI-compatible, ~100x cheaper).
# Falls back to Anthropic if only ANTHROPIC_API_KEY is set.

def _use_deepseek() -> bool:
    return bool(os.environ.get("DEEPSEEK_API_KEY"))


def _get_openai_client():  # returns openai.OpenAI
    import openai
    return openai.OpenAI(
        api_key=os.environ["DEEPSEEK_API_KEY"],
        base_url="https://api.deepseek.com",
    )


def _get_anthropic_client():
    import anthropic
    return anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


def _flash_model() -> str:
    if _use_deepseek():
        return os.environ.get("DEEPSEEK_DEFAULT_MODEL", "deepseek-chat")
    return "claude-haiku-4-5-20251001"


def _pro_model() -> str:
    if _use_deepseek():
        return os.environ.get("DEEPSEEK_PRO_MODEL", "deepseek-chat")
    return "claude-opus-4-7"


def _model(mode: str) -> str:
    return _flash_model() if mode == "flash" else _pro_model()


# ── Prompts ───────────────────────────────────────────────────────────────────

_FLASH_POLICY = """\
Estrai, struttura, non sovra-interpretare. Preferisci campi concisi. Se incerto, marca come candidate. Non inventare dati di progressi o misurazioni non esplicitamente presenti nei materiali.
"""

_PRO_POLICY = """\
Analizza in profondità l'intero profilo del cliente. Identifica plateau, incongruenze tra dichiarazioni e risultati, rischi fisici, progressi reali vs attesi, e prossime azioni prioritarie per il trainer. Collega ogni affermazione alla fonte specifica. Marca assunzioni esplicitamente.
REGOLA ASSOLUTA: non inventare misurazioni, pesi, ripetizioni, date o valori biometrici non presenti nei materiali caricati. Se un dato è utile ma non disponibile, scrivi "dato non disponibile — raccogliere alla prossima sessione".
"""

def _analysis_prompt_policy(mode: str) -> str:
    return _PRO_POLICY if mode == "pro" else _FLASH_POLICY

_SYSTEM_PROMPT = """\
Sei Aria, assistente AI di SchedaPRO per personal trainer italiani. Organizzi la scheda cliente,
estrai progressi verificabili, rilevi plateau e incongruenze, e prepari materiale di lavoro
controllabile dal trainer.

Il tuo compito è analizzare i materiali della scheda cliente (log sessioni, misurazioni, note,
audio, documenti) e produrre un'analisi strutturata completa in formato JSON valido.

CAMPI JSON — MAPPATURA FITNESS:
- case_id: slug del nome cliente (es. "marco-bianchi")
- case_title: nome completo del cliente
- case_summary: panoramica in 2-3 frasi (età, obiettivo, livello, stato attuale)
- timeline: sessioni svolte (date, esercizi principali, note tecniche, fonte)
- people: riferimenti del cliente (medico, nutrizionista, parente emergenza)
- evidence: esercizi/movimenti monitorati (title=nome, status=migliorato/plateau/regresso/non_valutabile, notes=metriche e note)
- open_questions: domande aperte del trainer (recupero, limitazioni, motivazione, aderenza)
- missing_documents: informazioni mancanti (visita medica, misurazioni specifiche, foto progresso)
- contradictions: plateau o incongruenze rilevate (es. "dichiara aderenza ma nessun progresso in 6 settimane")
- procedural_deadlines: appuntamenti (deadline_type: hearing=sessione_pt, defense_brief=check_in, filing=gara_evento, investigation=visita_medica, other=altro)
- brief_markdown: report sintetico per il trainer in markdown
- legal_analysis: analisi del progresso (vedi sotto)
  - risk_level: livello attenzione (low=ottimo progresso, medium=progresso normale, high=plateau, critical=regressione o rischio fisico)
  - risk_summary: stato generale del percorso in 1-2 frasi
  - immediate_actions: azioni prioritarie del trainer (massimo 5)
  - charges: obiettivi di allenamento (charge_name=nome obiettivo, charge_code=codice breve, notes=stato attuale)
  - strategies: approcci e metodologie di allenamento suggerite
  - constitutional_issues: controindicazioni mediche o fisiche rilevate (issue_type: procedural_violation=limitazione_fisica, illegal_search=controindicazione_medica)
  - witness_assessments: autovalutazioni del cliente (credibility_score = affidabilità dichiarazioni 0-1)
  - evidence_balance: bilanciamento risultati (prosecution_strength=aderenza al piano, defense_strength=autogestione del cliente, overall_assessment=sintesi)
  - client_summary: messaggio di feedback per il cliente in linguaggio semplice e motivante

REGOLE FONDAMENTALI:
1. Ogni affermazione deve essere collegata alla fonte specifica (source_refs con citazione esatta).
2. Non inventare misurazioni, pesi, ripetizioni o date non presenti nei materiali.
3. Segnala incertezze con confidence bassa (< 0.7) e stato candidate/needs_review.
4. Non sei un medico: per sintomi o problemi fisici segnala come open_question con nota "da verificare con medico/fisioterapista".
5. Le schede generate sono bozze: il trainer le verifica prima di consegnarle al cliente.

OUTPUT: Restituisci SOLO JSON valido, nessun testo aggiuntivo prima o dopo.
"""

_ANALYSIS_SCHEMA = """\
{
  "case_id": "string (slug from title)",
  "case_title": "string",
  "language": "it|en",
  "case_summary": "string (2-3 sentences)",
  "materials": [{"id":"str","name":"str","kind":"text|pdf|image|audio","description":"str","excerpt":"str","content":"str"}],
  "timeline": [{"date":"YYYY-MM-DD|null","time":"HH:MM|null","title":"str","description":"str","source_refs":[{"source_name":"str","page":1,"chunk":"str|null","quote":"str","confidence":0.0-1.0}],"confidence":0.0-1.0}],
  "people": [{"name":"str","role":"str","notes":"str","source_refs":[...]}],
  "evidence": [{"title":"str","status":"str","notes":"str","source_refs":[...]}],
  "open_questions": [{"question":"str","why_it_matters":"str","source_refs":[...]}],
  "missing_documents": [{"title":"str","reason":"str","priority":"alta|media|bassa"}],
  "contradictions": [{"title":"str","description":"str","source_refs":[...]}],
  "procedural_deadlines": [{"title":"str","deadline_type":"hearing|defense_brief|filing|investigation|other","due_date":"YYYY-MM-DD","due_time":"HH:MM|null","status":"confirmed|candidate|needs_review","urgency":"alta|media|bassa","description":"str","feriale_applied":false,"start_work_date":"YYYY-MM-DD|null","internal_target_date":"YYYY-MM-DD|null","source_refs":[...],"tasks":["str"]}],
  "brief_markdown": "string (markdown)",
  "usage_estimate": {"pages":0,"audio_minutes":0,"flash_input_tokens":0,"flash_output_tokens":0,"pro_used":false,"model_route":"str"},
  "legal_analysis": {
    "risk_level": "low|medium|high|critical",
    "risk_summary": "str",
    "immediate_actions": ["str"],
    "charges": [{"charge_code":"str","charge_name":"str","max_sentence":"str","elements_required":[{"element":"str","description":"str","status":"proven|disputed|weak|missing","notes":"str","source_refs":[...]}],"available_defenses":["str"],"prosecution_strength":0.0-1.0,"notes":"str","source_refs":[...]}],
    "strategies": [{"title":"str","target_charge_id":"str|null","strategy_type":"alibi|misidentification|lack_of_intent|procedural|constitutional|affirmative|negotiation","priority":"primary|secondary|fallback","description":"str","strengths":["str"],"risks":["str"],"required_evidence":["str"],"source_refs":[...]}],
    "constitutional_issues": [{"title":"str","issue_type":"illegal_search|coerced_confession|right_to_counsel|due_process|speedy_trial|procedural_violation|evidence_tampering","severity":"critical|significant|minor","description":"str","legal_basis":"str","remedy":"str","source_refs":[...]}],
    "witness_assessments": [{"witness_name":"str","role":"prosecution|defense|neutral|expert","credibility_score":0.0-1.0,"key_testimony":"str","strengths":["str"],"vulnerabilities":["str"],"cross_examination_angles":["str"],"source_refs":[...]}],
    "evidence_balance": {"prosecution_strength":0.0-1.0,"defense_strength":0.0-1.0,"key_prosecution_evidence":["str"],"key_defense_evidence":["str"],"critical_gaps":["str"],"overall_assessment":"str"},
    "client_summary": "str (plain language for client)"
  }
}
"""

_DEFAULT_CHAT_SYSTEM = """\
Sei Aria, il coach AI di SchedaPRO per personal trainer italiani. \
Sei il supporto tecnico del trainer che stai assistendo — non uno strumento generico, una specialista di fitness e coaching.

REGOLE DI COMPORTAMENTO:
- Il tuo nome è Aria. Punto. Non hai altri nomi.
- Rivolgiti sempre al trainer con "Trainer" — tono professionale ma diretto
- Non uscire mai dal personaggio
- Non sei un medico: per qualsiasi sintomo fisico o problema di salute, rimanda sempre al medico o fisioterapista
- Quando non sei certa di qualcosa, dillo chiaramente: "Su questo aspetto ti consiglio di confrontarti con un medico/fisioterapista"
- Scrivi in italiano, tono professionale ma energico — come un coach esperto

COMPETENZE:
- Programmazione dell'allenamento (periodizzazione, sovraccarico progressivo, deload, tapering)
- Principi di nutrizione sportiva e composizione corporea (NON diete mediche)
- Tecniche di esecuzione dei principali esercizi di forza, resistenza e funzionale
- Monitoraggio del progresso: misurazioni, foto, performance, RPE, HRV
- Motivazione e aderenza al piano: tecniche di coaching comportamentale
- Infortuni comuni nello sport amatoriale e prevenzione (segnala sempre al medico)

GENERAZIONE PIANI:
- Ogni piano generato è una bozza: il trainer la verifica e personalizza prima di consegnarla al cliente
- Basa ogni raccomandazione sui dati reali del cliente presenti nella scheda
- Non inventare misurazioni o progressi non presenti nella scheda
- Cita sempre la fonte ("da log del 15/05", "da misurazione del 01/05")

DISCLAIMER MEDICO:
- Non fornire mai consigli medici o diagnosi
- Per dolori, sintomi, o condizioni mediche: "Da valutare con medico/fisioterapista prima di continuare"
- La scheda è materiale di lavoro: il trainer verifica e adatta prima della consegna al cliente."""


# ── Analysis (non-streaming) ──────────────────────────────────────────────────

# Token budgets: flash model analysis needs significant headroom because the
# structured JSON schema is verbose.  Five-page documents routinely produce
# 15-25K output tokens.  Budgets are set with ~2x safety margin.
_FLASH_MAX_TOKENS = int(os.environ.get("PLT_FLASH_MAX_TOKENS", "32000"))
_PRO_MAX_TOKENS = int(os.environ.get("PLT_PRO_MAX_TOKENS", "64000"))
# Cap input text to avoid overwhelming context window (DeepSeek V4 = 128K)
_MAX_INPUT_CHARS = int(os.environ.get("PLT_MAX_ANALYSIS_CHARS", "60000"))

def _max_tokens(mode: str) -> int:
    return _PRO_MAX_TOKENS if mode == "pro" else _FLASH_MAX_TOKENS


_PRO_MESSAGE_PREFIX = "Ho rilevato elementi che meritano un'analisi approfondita"
_PRO_REASON_LABELS = {
    "contradictions": "plateau o incongruenze nel percorso",
    "candidate_deadline": "un appuntamento da confermare",
    "urgent_deadline": "un appuntamento o evento imminente",
    "serious_charge": "un profilo di attenzione elevata",
    "custody_or_precautionary_measure": "possibili controindicazioni fisiche",
    "missing_key_document": "informazioni mancanti sulla scheda",
    "evidence_conflicts": "dati di progresso contrastanti",
    "strategy_or_drafting_needed": "richiesta di piano o report",
}


def _contains_any(text: str, needles: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(n in lowered for n in needles)


def _build_pro_recommendation(case: CaseAnalysis, mode: str) -> ProRecommendation:
    """Suggest Pro at lawyer-anxiety moments, without running or charging for Pro."""
    if mode == "pro":
        return ProRecommendation(recommended=False, reasons=[], message="")

    reasons: list[str] = []

    if len(case.contradictions) >= 1:
        reasons.append("contradictions")

    if any(d.status in {"candidate", "needs_review"} for d in case.procedural_deadlines):
        reasons.append("candidate_deadline")
    if any(d.urgency == "alta" and d.due_date for d in case.procedural_deadlines):
        reasons.append("urgent_deadline")

    if any(d.priority == "alta" for d in case.missing_documents) or len(case.missing_documents) >= 1:
        reasons.append("missing_key_document")

    la = case.legal_analysis
    if la:
        if la.risk_level in {"high", "critical"}:
            reasons.append("serious_charge")
        combined = " ".join(
            [la.risk_summary, *la.immediate_actions, la.client_summary]
            + [c.charge_name + " " + c.notes for c in la.charges]
            + [s.title + " " + s.description for s in la.strategies]
        )
        if _contains_any(combined, ("dolore", "infortunio", "controindicaz", "medico", "fisiotera", "limitaz")):
            reasons.append("custody_or_precautionary_measure")
        if la.evidence_balance and (
            la.evidence_balance.critical_gaps
            or abs(la.evidence_balance.prosecution_strength - la.evidence_balance.defense_strength) <= 0.15
        ):
            reasons.append("evidence_conflicts")
        if la.strategies or _contains_any(combined, ("piano", "scheda", "programma", "report", "strateg", "periodizzaz")):
            reasons.append("strategy_or_drafting_needed")

    ordered_unique = list(dict.fromkeys(reasons))
    if not ordered_unique:
        return ProRecommendation(recommended=False, reasons=[], message="")

    natural = [_PRO_REASON_LABELS[r] for r in ordered_unique[:3]]
    if len(natural) == 1:
        detail = natural[0]
    else:
        detail = ", ".join(natural[:-1]) + " e " + natural[-1]

    return ProRecommendation(
        recommended=True,
        reasons=ordered_unique,
        message=f"{_PRO_MESSAGE_PREFIX}: {detail}. Puoi continuare con l’analisi standard oppure avviare un’Analisi Pro.",
        cta_label="Analisi Approfondita con Aria",
        alternate_label="Continua con analisi standard",
        requires_confirmation=True,
        auto_charge=False,
    )


def _truncate_materials(materials: list, max_chars: int) -> list:
    """Truncate material texts to stay within a total character budget.

    Longest materials are truncated first; short materials are left intact
    when possible.  A trailing truncation marker is appended so the model
    knows the text was cut.
    """
    total = sum(len(m.text) for m in materials)
    if total <= max_chars:
        return materials

    # Sort by length descending — truncate longest first
    indexed = sorted(enumerate(materials), key=lambda x: len(x[1].text), reverse=True)
    budget = max_chars
    result = [None] * len(materials)

    for i, m in indexed:
        if budget <= 0:
            result[i] = m.model_copy(update={"text": "[TESTO OMESSO — limite analisi]"})
            continue
        if len(m.text) <= budget:
            result[i] = m
            budget -= len(m.text)
        else:
            truncated = m.text[:max(1, budget - 40)] + "\n\n[...TESTO TRONCATO — materiale troppo lungo per l'analisi corrente]"
            result[i] = m.model_copy(update={"text": truncated})
            budget = 0

    return result


def analyze_case(request: AnalyzeRequest) -> CaseAnalysis:
    """Produce a full CaseAnalysis JSON from raw text materials."""
    model = _model(request.mode)
    max_tok = _max_tokens(request.mode)

    # Truncate materials to fit within the analysis budget
    truncated = _truncate_materials(request.materials, _MAX_INPUT_CHARS)
    if any(len(m.text) < len(orig.text) for m, orig in zip(truncated, request.materials)):
        logger.warning(
            "analyze_case: input truncated from %d to %d chars",
            sum(len(m.text) for m in request.materials),
            sum(len(m.text) for m in truncated),
        )

    scheda = [m for m in truncated if getattr(m, "category", "fascicolo") != "giurisprudenza"]
    riferimenti = [m for m in truncated if getattr(m, "category", "fascicolo") == "giurisprudenza"]

    parts: list[str] = []
    if scheda:
        parts.append("── MATERIALI SCHEDA CLIENTE ──")
        parts.extend(f"=== {m.name} ({m.kind}) ===\n{m.text}" for m in scheda)
    if riferimenti:
        parts.append("── RIFERIMENTI E DOCUMENTAZIONE AGGIUNTIVA ──")
        parts.append("(Documenti di riferimento caricati dal trainer: referti medici, schede precedenti, note nutrizioniste, ecc.)")
        parts.extend(f"=== {m.name} ({m.kind}) ===\n{m.text}" for m in riferimenti)
    materials_text = "\n\n".join(parts)
    prompt_policy = _analysis_prompt_policy(request.mode)
    user_message = f"""\
Nome cliente: {request.case_title}
Lingua output: {request.language}
Modalità: {request.mode}

POLICY MODALITÀ:
{prompt_policy}

MATERIALI SCHEDA CLIENTE:
{materials_text}

Analizza i materiali e restituisci un JSON completo conforme a questo schema:
{_ANALYSIS_SCHEMA}

Istruzioni specifiche:
- Estrai tutte le sessioni svolte con date e dettagli (esercizi, carichi, note tecniche).
- Identifica TUTTI i plateau o incongruenze tra dichiarazioni del cliente e dati oggettivi.
- Gli appuntamenti vanno estratti come procedural_deadlines: usare deadline_type hearing=sessione_pt, defense_brief=check_in, filing=gara_evento, investigation=visita_medica.
- Per ogni affermazione, includi la source_ref con la citazione esatta dal materiale.
- Se la modalità è flash: organizza la scheda, estrai fatti, non inventare programmi di allenamento.
- Se la modalità è pro: analizza in profondità plateau, progressi reali vs attesi, approcci metodologici ottimali, azioni prioritarie, sempre con fonti e assunzioni esplicite.
- REGOLA ASSOLUTA: non inventare misurazioni, pesi, date o valori non presenti nei materiali.
"""

    logger.info("analyze_case: cliente=%s, materials=%d, prompt_chars=%d, max_tokens=%d",
                request.case_title, len(request.materials), len(user_message), max_tok)

    if _use_deepseek():
        raw, usage, finish_reason = _deepseek_complete(model, _SYSTEM_PROMPT, user_message, max_tok)
    else:
        raw, usage, finish_reason = _anthropic_complete(model, _SYSTEM_PROMPT, user_message, max_tok)

    logger.info("analyze_case: AI response=%d chars, input_tokens=%d, output_tokens=%d, finish=%s",
                len(raw), usage["input"], usage["output"], finish_reason)

    if finish_reason == "length":
        logger.error("analyze_case: output truncated by token limit (max_tokens=%d)", max_tok)
        raise ValueError(
            f"L'analisi è stata troncata dal limite di token ({max_tok}). "
            "Prova a caricare meno documenti alla volta o usa la modalità Pro per analisi più lunghe."
        )

    # Strip markdown fences and extract the outermost JSON object robustly
    if "```" in raw:
        raw = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        logger.error("No JSON object found. Raw response preview: %s", raw[:500])
        raise ValueError(f"No JSON object found in AI response. Raw start: {raw[:200]!r}")
    raw = match.group(0)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("JSON decode failed. Raw preview: %s", raw[:1000])
        logger.error("JSON error: %s", exc)
        raise
    data.setdefault("usage_estimate", {})
    data["usage_estimate"].update({
        "flash_input_tokens": usage["input"],
        "flash_output_tokens": usage["output"],
        "pro_used": request.mode == "pro",
        "model_route": model,
    })
    data["usage_estimate"].setdefault("pages", len(request.materials))
    data["usage_estimate"].setdefault("audio_minutes", 0)
    case = CaseAnalysis.model_validate(data)
    return case.model_copy(update={"pro_recommendation": _build_pro_recommendation(case, request.mode)})


def _deepseek_complete(model: str, system: str, user: str, max_tokens: int) -> tuple[str, dict, str]:
    client = _get_openai_client()
    resp = client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
    )
    text = resp.choices[0].message.content or ""
    usage = {"input": resp.usage.prompt_tokens, "output": resp.usage.completion_tokens}
    finish = resp.choices[0].finish_reason or "stop"
    return text, usage, finish


def _anthropic_complete(model: str, system: str, user: str, max_tokens: int) -> tuple[str, dict, str]:
    client = _get_anthropic_client()
    msg = client.messages.create(
        model=model, max_tokens=max_tokens, system=system,
        messages=[{"role": "user", "content": user}],
    )
    text = msg.content[0].text
    usage = {"input": msg.usage.input_tokens, "output": msg.usage.output_tokens}
    finish = msg.stop_reason or "stop"
    return text, usage, finish


# ── Chat (streaming SSE) ──────────────────────────────────────────────────────

def stream_chat(request: ChatRequest) -> Generator[str, None, None]:
    """Yield SSE chunks for the /api/chat endpoint."""
    model = _model(request.mode)
    system = request.system_override or _DEFAULT_CHAT_SYSTEM
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    if _use_deepseek():
        yield from _deepseek_stream(model, system, messages)
    else:
        yield from _anthropic_stream(model, system, messages)


def _deepseek_stream(model: str, system: str, messages: list) -> Generator[str, None, None]:
    client = _get_openai_client()
    stream = client.chat.completions.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "system", "content": system}, *messages],
        stream=True,
    )
    for chunk in stream:
        text = chunk.choices[0].delta.content or ""
        if text:
            yield f"data: {json.dumps({'text': text})}\n\n"
    yield "data: [DONE]\n\n"


def _anthropic_stream(model: str, system: str, messages: list) -> Generator[str, None, None]:
    import anthropic
    client = _get_anthropic_client()
    with client.messages.stream(
        model=model, max_tokens=4096, system=system, messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield f"data: {json.dumps({'text': text})}\n\n"
    yield "data: [DONE]\n\n"
