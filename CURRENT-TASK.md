# CURRENT-TASK.md — SchedaPRO

Last updated: 2026-06-03

---

## ✅ DONE — Blocco con PIN + biometria (2026-06-03)

Cancello locale (`src/lock/`) sopra la sessione Supabase, per proteggere i dati local-only del cliente su device perso/condiviso. **PIN a 4 cifre** (hash PBKDF2, mai in chiaro) + **biometria WebAuthn opzionale**; blocco all'avvio e dopo inattività/background; recupero via re-login (niente cifratura at-rest → nessun rischio perdita dati); gestione da Profilo. Warm-up ping invariato. Design-of-record nel gemello PLT (`docs/superpowers/specs/2026-06-03-app-lock-pin-design.md`). Commit: Fase 1 `bdae9f4d3`, Fase 2 `fa9228fd0`. Test: `npm run test:app-lock`. ✅ PIN verificato live su Netlify.

---

## ✅ DONE — Comunicazione del valore di Aria (2026-06-03)

L'app si sottovendeva al primo impatto. Nuovo modulo `src/value/`: modale valore una-tantum al primo avvio (prima del tour), hint contestuali a FAB Aria / istruzioni aggiuntive / bozze, sezione «Cosa fa Aria» + **interruttore globale dei suggerimenti** nel Profilo (spegne modale+hint+tour, non tocca il login). Riscritta la copy del login (headline differenziata, 4 proof-point), del tour e dell'invito tester. Spec/plan in `docs/superpowers/`. Test `npm run test:value-messaging` (12 check) + `test:auth-onboarding`. Commit: `097dc9a4a`→`8402d81bd`/`6e17c5624`/`0307e49` (+ CSS toggle). Da portare a PLT (`docs/port-login-to-plt.md` §11). ⏳ QA live su Netlify dopo deploy.

---

## ✅ DONE — Logout forzato ogni 72h (2026-06-03)

L'utente deve ri-accettare il riquadro di avviso (e rifare login) almeno ogni 72h. `src/auth/sessionExpiry.ts` (TTL 72h, `recordAcceptance` al login, `isSessionExpired`/`ensureAcceptanceTs` nell'effetto di `App`, ricontrollo su `visibilitychange`). Test `npm run test:session-expiry`. Da portare a PLT (vedi `docs/port-login-to-plt.md` §10). ⏳ Da verificare live su Netlify dopo deploy.

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
- ✅ **Verificato e2e** (dev locale → backend Render con chiave reale): avvio analisi → torno alla lista → card mostra "Analisi in corso…" → analisi completata in background → lista auto-aggiornata con i risultati → scheda popolata. (lock telefono coperto dallo stesso meccanismo: job server-side + re-poll su `visibilitychange`).
- **"Ri-analizza" reso sicuro:** non è più un reset distruttivo a un click. Ora passa per il modale pre-flight (= conferma + istruzioni opzionali) e ri-analizza TUTTI i documenti in modalità `full`; `mergeWithAi` aggiorna l'output AI **preservando note, documenti e modifiche dell'utente**.

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

## Backlog

> Aggiornato il 2026-06-03. Le voci "Slice F / demo / auth Supabase / deploy / documentDrafts" del vecchio backlog sono **completate** (app live su Netlify + Render, auth Supabase attiva, `documentDrafts.ts` legale rimosso a favore di `pianoDrafts.ts`).

### Immediato (test-driven)
- [ ] **Sessione di validazione col trainer pronto** — far usare l'app, raccogliere 3 attriti + must-fix + segnale di valore (template in `05-validation/`).
- [ ] Triage + fix rapidi emersi dalla sessione (commit/push su `chiantera/schedapro`).

### Prossimo (post-test)
- [ ] **Comunicare il valore di Digital Trainer** — l'app si sottovende al primo impatto (feedback tester: "l'ennesimo gestionale"). Spec: `docs/superpowers/specs/2026-06-03-digital-trainer-value-messaging-design.md`. Superfici: login value-section, tour arricchito, hint contestuali in-app (FAB Aria / istruzioni aggiuntive / bozze), copy d'invito, copy Play Store. **Vincolo:** dopo il signup il login non si rivede più (solo PIN) → il messaggio ricorrente deve vivere in-app, non sul login.
- [ ] **Login biometrico (WebAuthn) — da sistemare:** lo sblocco biometrico necessita lavoro/verifica (gated su platform authenticator ma non rifinito). Per ora il PIN è la strada affidabile.
- [ ] Onboarding trainer più ricco al primo accesso (oltre al wizard spotlight già presente).
- [ ] Eventuale piano premium / pricing (allineato a PLT).
- [ ] Reclutare un 2°/3° trainer per allargare il test.

### Parcheggio
- [ ] Seed/demo più realistici per la prima impressione.
- [ ] Capacitor: build APK Android di test (wrapper già presente).

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
