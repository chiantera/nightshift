# CLAUDE.md — SchedaPRO

> Mirrors `AGENTS.md`. Claude Code auto-loads this file. **After ANY edit to this file, re-clone it verbatim to `AGENTS.md` in the same commit — both must stay byte-identical.**

You are working in `/home/deckard/projects/schedapro`, the SchedaPRO workspace.

Repo: `chiantera/schedapro` (`origin https://github.com/chiantera/schedapro.git`).  
Working convention: commit coherent slices directly to `main` and push.

---

## Mission

Design, build, and validate a mobile-first fitness client management product for personal trainers.

Core thesis:
> Trasforma il caos della scheda cliente in un piano di allenamento chiaro.

---

## Read first at the start of every SchedaPRO thread

1. `CURRENT-TASK.md` — latest handoff, verification, next steps, active backlog.
2. `backend/app/ai_service.py`, `frontend/src/prompts/`, `frontend/src/draftArtifacts.ts`, `frontend/src/main.tsx` before changing AI behavior.

Cross-reference: `../plt/alpha-pwa/` — PLT is the legal sibling product. Recycle infrastructure; don't import legal domain logic.

---

## Current app state

| Layer | Stack | Local port |
|---|---|---|
| Backend | FastAPI | 8001 |
| Frontend | React + Vite | 5174 |
| Auth | Supabase | deployed builds only |
| AI primary | DeepSeek (OpenAI-compatible) | `DEEPSEEK_API_KEY` |
| AI fallback | Anthropic | `ANTHROPIC_API_KEY` |

---

## Workspace structure

```text
backend/
  app/main.py           FastAPI routes
  app/ai_service.py     Provider routing, Flash/Pro, analysis/chat
  app/models.py         Pydantic contracts: CaseAnalysis, AnalisiProgressi, Appuntamento…
  app/ocr_adapter.py    Mistral OCR
  tests/                Backend contract tests (pytest)

frontend/src/
  main.tsx                   Main React shell
  domain/types.ts            Fitness types: CaseAnalysis, AnalisiProgressi, Appuntamento…
  domain/caseContext.ts      buildCaseContext() — builds AI context string
  domain/caseMerge.ts        mergeWithAi() — merges AI output into existing case
  prompts/aria.ts            SYSTEM_PROMPT_IT (Aria persona)
  prompts/pianoDrafts.ts     PIANO_PROMPTS: 5 fitness plan prompts
  draftArtifacts.ts          Draft artifact wrapper
  sprExport.ts               .spr encrypted export/import
  db.ts                      IndexedDB persistence
  styles.css / tokens.css    Mobile-first dark UI
  screens/CaseDetailView.tsx Main client view
  components/AriaPromptBar.tsx Aria inline prompt
```

---

## Domain mapping (PLT → SchedaPRO)

| PLT concept | SchedaPRO concept |
|---|---|
| Fascicolo | Scheda cliente |
| GiulIA | Aria |
| `LegalAnalysis` | `AnalisiProgressi` |
| `ChargeAnalysis` | `Obiettivo` |
| `WitnessAssessment` | `ValutazioneAderenza` |
| `ConstitutionalIssue` | `LimitazioneFisica` |
| `DefenseStrategy` | `ApproccioAllenamento` |
| `ProceduralDeadline` | `Appuntamento` |
| `EvidenceBalance` | `BilancioProgressi` |
| Tab `legal` | Tab `analisi` |
| Tab `drafts` | Tab `piani` |
| `.plt` export | `.spr` export |
| `DOC_PROMPTS` | `PIANO_PROMPTS` |

---

## AI persona: Aria

Aria è il "secondo cervello" del trainer. Non è un medico. Non diagnostica. Aiuta il trainer a:
- strutturare il percorso del cliente;
- identificare plateau e rischi;
- generare bozze di piani modificabili.

Flash: estrazione, struttura, campi JSON.  
Pro: analisi profonda dei progressi, plateau, raccomandazioni.  
Pro richiede conferma esplicita dall'utente — mai silenzioso.

---

## Technical bias

Prefer:
- DeepSeek V4 Flash as default.
- Pro only after explicit user confirmation.
- Source-linked structured extraction.
- Mobile-first UI; verify in browser before calling work complete.

---

## Verification discipline

Before saying work is complete:

1. `cd backend && source .venv/bin/activate && python -m pytest tests/ -q`
2. `cd frontend && npm run build` — zero TypeScript errors.
3. Update `CURRENT-TASK.md` after each significant commit.
4. **Keep docs current as part of "done" — especially `README.md`** (feature list, codebase tree, endpoints, verification commands), but also the other `.md` files (`CURRENT-TASK.md`, ecc.). If architecture/features/setup change, update them in the same commit; don't leave it as a separate thing to remember.
5. **After editing `CLAUDE.md`, re-clone it verbatim to `AGENTS.md` in the same commit** (both must stay byte-identical).

---

## Local dev quick start

Backend:
```bash
cd /home/deckard/projects/schedapro/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DEEPSEEK_API_KEY=sk-...
uvicorn app.main:app --reload --port 8001
```

Frontend:
```bash
cd /home/deckard/projects/schedapro/frontend
npm install
VITE_BYPASS_AUTH=true npm run dev -- --port 5174
```

Vite dev server proxies `/api/*` to `http://localhost:8001`.
