# CURRENT-TASK.md — SchedaPRO

Last updated: 2026-06-01

---

## 🟢 LIVE

- **Frontend:** https://digitaltrainer.netlify.app (Netlify)
- **Backend:** Render (vedi `render.yaml`)
- **Brand pubblico:** "Digital Trainer" — coach AI per personal trainer.

---

## Stato corrente

**Branch:** `main`

### Sessione 2026-06-01 (b3) — analisi in background resiliente

- [x] L'analisi gira come **job backend** (`POST/GET /api/analyze-jobs`, ThreadPoolExecutor, store in-memory TTL 1h; test `tests/test_analysis_jobs.py`).
- [x] **`src/analysis/analysisManager.ts`** a livello app: avvia il job, salva il `job_id` in localStorage, fa polling (2s), riprende su `visibilitychange` e all'avvio app (`resumePersistedAnalyses`), e al completamento fa il merge nel DB locale. → l'analisi sopravvive a: tornare alla lista, aprire un altro cliente, **lock del telefono**, refresh.
- [x] CaseDetailView: `analyzing` deriva dal manager; banner + risultati riappaiono al rientro; abort → `abortAnalysis`. Lista: pill "Analisi in corso…" per card + refresh al completamento.
- ⚠️ Caveat Render free-tier: cold-start a metà job → il client riceve 404 e mostra "Analisi interrotta sul server. Riprova." (bulletproof = persistere su Supabase, fuori scope).
- Portabile a PLT: `docs/port-login-to-plt.md` §8.
- **Da verificare e2e sul deployato** (serve la chiave DeepSeek su Render): start → torna alla lista → rientra → risultati/progress; lock telefono → sblocco.

### Sessione 2026-06-01 (b2) — account controls + UX + istruzioni AI — fatto, verificato in browser

- [x] **Account controls** (Profilo + Logout rapido con conferma) in alto a destra su home e scheda cliente (`components/AccountControls.tsx`, client supabase estratto in `supabaseClient.ts`).
- [x] **AriaPromptBar**: placeholder centrato + nuovo testo.
- [x] **Upload drawer**: autofocus sulla textarea all'apertura.
- [x] **Istruzioni per Aria (pre-flight modal)**: prima di Analizza / Crea bozza un modale facoltativo (`components/AiInstructionsModal.tsx`) raccoglie istruzioni che orientano la risposta. Backend: `AnalyzeRequest.user_instructions` + weaving in `ai_service._build_analysis_user_message` (test `tests/test_user_instructions.py`, 28/28 verdi). Rimossa la vecchia `confirm()` del Pro (il modale è la conferma). Esclusi inline Aria + FAB.
- Tutto portabile a PLT: vedi [`docs/port-login-to-plt.md`](docs/port-login-to-plt.md) (sezioni 5–7).

### Login page (`AuthScreen` in `frontend/src/main.tsx`) — fatto, verificato in locale

- [x] Pannello guidato di benvenuto sulla login page (`AuthTour`: leggi l'avvertimento → spunta la casella → accedi/registrati), in stile wizard (`.tour-*`). Chiave dismiss separata `schedapro:auth-tour:dismissed`.
- [x] Swap layout: avvertimento + box accesso a **sinistra**, hero "Gestisci i tuoi clienti con l'AI." a **destra** (mobile: avvertimento in cima).
- [x] Hero arricchito a 6 feature reali (aggiunte: Chiedi ad Aria, Detta a voce, Anonimizza, Esporta `.spr`).
- [x] `README.md` completo per `chiantera/schedapro` con albero ASCII del codebase.
- [x] **Fix logout in dev bypass:** `useAuth` ora ascolta `SIGNED_OUT` anche in modalità `VITE_BYPASS_AUTH`, così "Esci dall'account" funziona su localhost (prima la sessione finta non si azzerava mai).

Verificato in browser su `127.0.0.1` (build verde, logout → login page, layout desktop+mobile, pannello guida). Committato e live su Netlify.

**Port back → PLT:** vedi [`docs/port-login-to-plt.md`](docs/port-login-to-plt.md) — guida per portare disclaimer+checkbox, AuthTour, layout, e fix logout bypass verso `/home/deckard/projects/plt/alpha-pwa/`.

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
  backend/     FastAPI (dev: porta 8409)
  frontend/    React+Vite (dev: porta 5409)
  demo/        Seed data (marco-bianchi-seed.js)
```

Backend deploy: Render (vedi `render.yaml`)  
Frontend deploy: Netlify → https://digitaltrainer.netlify.app  
PLT sibling: `/home/deckard/projects/plt/alpha-pwa/` — non toccare
