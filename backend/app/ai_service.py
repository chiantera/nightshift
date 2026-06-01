from __future__ import annotations

import json
import logging
import os
import re
import sys
from collections.abc import Generator

from .models import (
    AnalisiProgressi,
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
  "case_id": "string (slug del nome cliente, es. 'marco-bianchi')",
  "case_title": "string (nome completo cliente)",
  "language": "it|en",
  "case_summary": "string (2-3 frasi: età, obiettivo, livello, stato attuale)",
  "materials": [{"id":"str","name":"str","kind":"text|pdf|image|audio","description":"str","excerpt":"str","content":"str"}],
  "timeline": [{"date":"YYYY-MM-DD|null","time":"HH:MM|null","title":"str (es. 'Sessione forza — Giorno A')","description":"str (esercizi, carichi, note tecniche)","tipo_sessione":"forza|cardio|mobilita|hiit|recupero|altro|null","source_refs":[{"source_name":"str","page":1,"chunk":"str|null","quote":"str","confidence":0.0-1.0}],"confidence":0.0-1.0}],
  "people": [{"name":"str","role":"str (es. cliente, medico, nutrizionista, fisioterapista)","notes":"str","source_refs":[...]}],
  "evidence": [{"title":"str (es. 'Panca piana', 'Peso corporeo')","status":"str (migliorato|plateau|regresso|non_valutabile)","notes":"str (metriche: es. '80kg→90kg in 3 mesi')","source_refs":[...]}],
  "open_questions": [{"question":"str (es. 'Perché il peso non cala nonostante le sessioni?')","why_it_matters":"str","source_refs":[...]}],
  "missing_documents": [{"title":"str (es. 'Visita medico sportivo', 'Foto progresso mese 2')","reason":"str","priority":"alta|media|bassa"}],
  "contradictions": [{"title":"str (es. 'Dichiara aderenza ma progressi assenti')","description":"str","source_refs":[...]}],
  "procedural_deadlines": [{"title":"str","deadline_type":"sessione_pt|check_in|gara|visita_medica|altro","due_date":"YYYY-MM-DD","due_time":"HH:MM|null","status":"confirmed|candidate|needs_review","urgency":"alta|media|bassa","description":"str","source_refs":[...],"tasks":["str"]}],
  "brief_markdown": "string (report markdown per il trainer: stato, progressi chiave, azioni prioritarie)",
  "usage_estimate": {"pages":0,"audio_minutes":0,"flash_input_tokens":0,"flash_output_tokens":0,"pro_used":false,"model_route":"str"},
  "analisi_progressi": {
    "livello_attenzione": "low|medium|high|critical (low=ottimo progresso, medium=nella norma, high=plateau/stallo, critical=regressione o rischio fisico)",
    "sommario": "str (sintesi stato percorso in 1-2 frasi)",
    "azioni_immediate": ["str (azioni prioritarie del trainer, massimo 5)"],
    "obiettivi": [{"obiettivo_code":"str (es. 'OBJ-1')","obiettivo_nome":"str (es. 'Aumento massa muscolare')","scadenza_target":"str (es. 'Obiettivo entro 6 mesi')","step_obiettivo":[{"element":"str","description":"str","status":"raggiunto|in_corso|plateau|non_avviato","notes":"str","source_refs":[...]}],"strategie":["str (strategie per raggiungere l obiettivo)"],"progresso_score":0.0-1.0,"notes":"str","source_refs":[...]}],
    "approcci": [{"title":"str","obiettivo_ref":"str|null","tipo":"str (periodizzazione|sovraccarico_progressivo|deload|nutrizione|recupero|altro)","priority":"primary|secondary|fallback","description":"str","strengths":["str"],"risks":["str"],"dati_necessari":["str"],"source_refs":[...]}],
    "limitazioni_fisiche": [{"title":"str (es. 'Dolore al ginocchio destro')","issue_type":"str (infortunio|controindicazione_medica|limitazione_tecnica|altro)","severity":"critical|significant|minor","description":"str","fonte":"str (es. 'Riferito in sessione del 10/05')","raccomandazione":"str (es. 'Sospendere squat, consultare fisioterapista')","source_refs":[...]}],
    "valutazioni_aderenza": [{"nome":"str (nome cliente o riferimento)","role":"cliente|medico|fisioterapista|nutrizionista|expert","affidabilita_score":0.0-1.0,"dichiarazione_chiave":"str (dichiarazione o autovalutazione chiave)","strengths":["str"],"vulnerabilities":["str"],"domande_approfondimento":["str (domande da approfondire con il cliente)"],"source_refs":[...]}],
    "bilancio": {"progresso_score":0.0-1.0,"autonomia_score":0.0-1.0,"progressi_chiave":["str (progressi oggettivi)"],"fattori_favorevoli":["str (fattori autogestione)"],"critical_gaps":["str"],"valutazione_generale":"str"},
    "nota_cliente": "str (messaggio motivante per il cliente, linguaggio semplice)"
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
_FLASH_MAX_TOKENS = int(os.environ.get("SPR_FLASH_MAX_TOKENS", "32000"))
_PRO_MAX_TOKENS = int(os.environ.get("SPR_PRO_MAX_TOKENS", "64000"))
# Cap input text to avoid overwhelming context window (DeepSeek V4 = 128K)
_MAX_INPUT_CHARS = int(os.environ.get("SPR_MAX_ANALYSIS_CHARS", "60000"))

def _max_tokens(mode: str) -> int:
    return _PRO_MAX_TOKENS if mode == "pro" else _FLASH_MAX_TOKENS


_PRO_MESSAGE_PREFIX = "Ho rilevato elementi che meritano un'analisi approfondita"
_PRO_REASON_LABELS = {
    "contradictions": "plateau o incongruenze nel percorso",
    "candidate_deadline": "un appuntamento da confermare",
    "urgent_deadline": "un appuntamento o evento imminente",
    "high_attention_level": "un profilo di attenzione elevata",
    "physical_contraindication": "possibili controindicazioni fisiche",
    "missing_key_document": "informazioni mancanti sulla scheda",
    "evidence_conflicts": "dati di progresso contrastanti",
    "strategy_or_drafting_needed": "richiesta di piano o report",
}


def _contains_any(text: str, needles: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(n in lowered for n in needles)


def _build_pro_recommendation(case: CaseAnalysis, mode: str) -> ProRecommendation:
    """Suggest Pro at high-stakes coaching moments (plateau, injury risk, missing data), without running or charging for Pro."""
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

    la = case.analisi_progressi
    if la:
        if la.livello_attenzione in {"high", "critical"}:
            reasons.append("high_attention_level")
        combined = " ".join(
            [la.sommario, *la.azioni_immediate, la.nota_cliente]
            + [o.obiettivo_nome + " " + o.notes for o in la.obiettivi]
            + [a.title + " " + a.description for a in la.approcci]
        )
        if _contains_any(combined, ("dolore", "infortunio", "controindicaz", "medico", "fisiotera", "limitaz")):
            reasons.append("physical_contraindication")
        if la.bilancio and (
            la.bilancio.critical_gaps
            or abs(la.bilancio.progresso_score - la.bilancio.autonomia_score) <= 0.15
        ):
            reasons.append("evidence_conflicts")
        if la.approcci or _contains_any(combined, ("piano", "scheda", "programma", "report", "strateg", "periodizzaz")):
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

    scheda = [m for m in truncated if getattr(m, "category", "scheda") != "documento_medico"]
    documenti_medici = [m for m in truncated if getattr(m, "category", "scheda") == "documento_medico"]

    parts: list[str] = []
    if scheda:
        parts.append("── MATERIALI SCHEDA CLIENTE ──")
        parts.extend(f"=== {m.name} ({m.kind}) ===\n{m.text}" for m in scheda)
    if documenti_medici:
        parts.append("── DOCUMENTI MEDICI E DI RIFERIMENTO ──")
        parts.append("(Referti medici, schede precedenti, note nutrizioniste, ecc. caricati dal trainer)")
        parts.extend(f"=== {m.name} ({m.kind}) ===\n{m.text}" for m in documenti_medici)
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
- Gli appuntamenti vanno estratti in procedural_deadlines con deadline_type: sessione_pt, check_in, gara, visita_medica, altro.
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
