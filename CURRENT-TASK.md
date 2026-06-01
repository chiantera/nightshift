# CURRENT-TASK.md — SchedaPRO

Last updated: 2026-06-01

---

## Stato corrente

**Branch:** `main`  
**Ultimo commit:** `d11df6fcb` — port banner analisi (abortable) da PLT

### Cosa è stato fatto

| Slice | Stato | Descrizione |
|---|---|---|
| A — Git + Docs | ✅ | `CLAUDE.md`, `AGENTS.md`, `SOUL.md`, `CURRENT-TASK.md` creati |
| B — Backend schema fitness | ✅ | `models.py` riscritto (AnalisiProgressi, Obiettivo, Appuntamento, ecc.) |
| B — Backend ai_service | ✅ | `_ANALYSIS_SCHEMA` fitness, titolo API, env vars `SPR_*` |
| B — Backend main.py | ✅ | `title="SchedaPRO API"`, health endpoint aggiornato |
| C — Frontend types.ts | ✅ | Tutti i tipi legali → fitness (AnalisiProgressi, Obiettivo, Appuntamento…) |
| C — AriaPromptBar | ✅ | `GiuliaPromptBar.tsx` eliminato → `AriaPromptBar.tsx`, CSS `aria-prompt-*` |
| C — sprExport.ts | ✅ | Nuovo file `.spr` (era `.plt`), `pltExport.ts` eliminato |
| C — documentDrafts.ts | ✅ | Eliminato (wrapper inutile), uso diretto di `PIANO_PROMPTS` |
| C — CaseDetailView.tsx | ✅ | Sweep completo: AnalisiProgressiTab, tutti i campi rinominati |
| C — main.tsx | ✅ | Import aggiornati, `obiettivi_summary`, AriaPromptBar, fitness types |
| C — caseContext.ts | ✅ | `buildCaseContext()` usa campi fitness |
| C — caseMerge.ts | ✅ | `mergeWithAi()` usa `analisi_progressi` |
| C — MultiFileUploadDrawer | ✅ | `fascicolo/giurisprudenza` → `scheda/documento_medico` |
| C — styles.css | ✅ | `.aria-prompt-*` CSS aggiunto |
| G — demo_data.py | ✅ | Riscritto con modelli fitness (3 clienti: Marco, Giulia, Luca) |
| H — Backend tests | ✅ | 25/25 test passano, tutti aggiornati al dominio fitness |
| Build TypeScript | ✅ | `npm run build` → zero errori |

---

## Porting da PLT (2026-06-01)

Moduli riusabili portati dal gemello legale PLT (`../plt/alpha-pwa/`):

| Modulo | Stato | Note |
|---|---|---|
| `src/onboarding/` — wizard spotlight | ✅ | Tour: crea cliente → aggiungi materiale → opzioni drawer → analizza. Niente step `auth` (c'è già AuthScreen + OnboardingScreen). Classi CSS namespace `.tour-*` (anti-collisione con `.onboarding-*` della welcome). Key `schedapro:onboarding:dismissed`. Eventi via `wizardBus` emessi da `main.tsx`/`CaseDetailView`. |
| `src/analysis/` — `<AnalysisProgressBanner/>` | ✅ | Banner non-bloccante con spinner + barra + **abort con conferma**. Aggiunto `AbortController` a `handleAnalyze` (prima l'analisi non era interrompibile) + `signal` sul fetch; sostituito il vecchio `.analyzing-banner`. |
| Repo hygiene | ✅ | Smesso di tracciare `backend/.venv` (~85k file!), `dist/`, `backend/.env`, pycache, tsbuildinfo (già in `.gitignore`, committati prima). Tracked: 85432 → 124. ⚠️ `.env` resta nella history (rigenerare le chiavi se non sono di test). |

Riferimenti port: `../plt/alpha-pwa/frontend/src/onboarding/README.md` e `.../analysis/README.md`.

**Da rivedere:** testi del wizard (dominio personal-trainer) e copy del banner; la nota vocale richiede `GROQ_API_KEY` valida sul backend schedapro.

---

## Next steps (backlog immediato)

### Slice F — Demo + verifica end-to-end

- [ ] Backend: `uvicorn app.main:app --reload --port 8001` → `/api/health` risponde 200
- [ ] Frontend: `VITE_BYPASS_AUTH=true npm run dev -- --port 5174` → dashboard clienti
- [ ] Verifica che i 3 clienti demo (Marco, Giulia, Luca) appaiano in dashboard
- [ ] Crea cliente nuovo, aggiungi log sessione, lancia analisi Aria
- [ ] Verifica che Aria generi `analisi_progressi` con `obiettivi`, `approcci`, ecc.
- [ ] Testa export `.spr` (sia plain che protetto)
- [ ] Testa `AriaPromptBar` in home e in scheda cliente

### Backlog post-demo

- [ ] Auth Supabase
- [ ] Deploy: Render (backend) + Netlify (frontend)
- [ ] Onboarding flow (primo accesso trainer)
- [ ] Demo seed `marco-bianchi-seed.js`
- [ ] `documentDrafts.ts` legale → rimuovi o sostituisci con fitness placeholder

---

## Architettura attuale

```
/home/deckard/projects/schedapro/
  backend/     FastAPI, porta 8001
  frontend/    React+Vite, porta 5174
  demo/        Seed data (marco-bianchi-seed.js)
```

Backend deploy: Render (non ancora configurato)  
Frontend deploy: Netlify (non ancora configurato)  
PLT sibling: `/home/deckard/plt/alpha-pwa/` — non toccare
