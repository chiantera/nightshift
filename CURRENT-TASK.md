# CURRENT-TASK.md — SchedaPRO

Last updated: 2026-06-25 (Nightshift — i18n IT/EN, Phase 1)

---

## 🚧 IN PROGRESS — Localizzazione IT/EN (avviata 2026-06-25)

Obiettivo: app bilingue (italiano + inglese). Decisioni prese con l'utente:
- **i18n custom leggero** (niente librerie pesanti), basato sul pattern `getPrefs/setPref/subscribePrefs`.
- **Demo data tradotti anche in EN** (serviti per lingua via `/api/cases`).
- **Default = auto-detect** da `navigator.language` (it-* → italiano, altrimenti inglese), con **toggle manuale** in Impostazioni che persiste.
- **Esecuzione a fasi**, build+test verdi a ogni fase.

### ✅ Fase 1 — Infrastruttura + login (FATTA)
- `frontend/src/settings/settingsStore.ts`: aggiunto `locale: 'it'|'en'` ad `AppPrefs` + `detectLocale()` per il default.
- Nuovo modulo `frontend/src/i18n/`: `index.ts` (`t`, `useT` reattivo via `useSyncExternalStore`, `currentLocale`, `renderRich` per `**bold**`), `it.ts`, `en.ts` (cataloghi a chiavi; EN fa fallback su IT).
- `frontend/src/dateUtils.ts`: locale-aware (`it-IT`/`en-GB`, nomi giorni via Intl, fallback `date.*` tradotti).
- `frontend/src/settings/sections/UnitsSection.tsx`: toggle **Lingua** (Italiano/English) + label tradotte.
- `frontend/src/main.tsx`: migrati **AuthHelp** e **AuthScreen** (login/landing) a `t()`; `<html lang>` sincronizzato col locale in `App`.
- Verificato con screenshot Playwright: `en-US`→inglese, `it-IT`→italiano, switch reattivo. Build verde.

### ✅ Fase 2a — main.tsx (FATTA)
- `main.tsx`: NewCaseDrawer, HomepageStats, OnboardingScreen, CaseListView → `t()`. Nuova scheda salva `language: currentLocale()`. ~70 chiavi (`cases.*`, `newcase.*`, `import.*`, `onboard.*`). Build verde, pushato.

### ✅ Fase 2b — components/ (FATTA)
- `AriaPromptBar`, `AccountControls`, `AiInstructionsModal`, `ChatPanel`, `MultiFileUploadDrawer` → `t()`. Aggiunte label bozze condivise `draft.label.*` (riusabili in CaseDetailView/exports). Build verde.

### ✅ Fase 2c — settings/, lock/, value (parziale) (in corso)
- `settings/` tutte le sezioni → `t()` (commit `9b4870b58`).
- `lock/` (LockScreen, LockSetup, LockManager, LockGate) → `t()` (commit `07c03c26b`).
- `value/` piccoli: `AriaCapabilities`, `ContextualHint`, `InfoPanelModal` + `heroMetric` (label home card) → `t()`.

### ✅ Fase 2c — onboarding + CaseDetailView (FATTA)
- `onboarding/OnboardingWizard.tsx` (tour, STEPS con titleKey/bodyKey) — commit `011b2f96a`.
- `screens/CaseDetailView.tsx` — **completo** in 4 parti (commit `c79377eff`, `f98ab94e0`, `66004d970`, `abd5babd7`): helper enum, drawer, AulaMode, AnalisiProgressiTab, Redaction/Anon/Export/Drafting, tab bar, e l'intero corpo (toast, hero, tutti i tab). 388 `tr()`, 0 residui. Nuova analisi invia `language: currentLocale()`.

**Fase 2 (UI) sostanzialmente completa.** Tutta l'interfaccia visibile è su `t()`.

### ⏳ Fase 3 — AI prompts + backend + demo (DA FARE)
1. **FirstRunWizard + personalization**: `value/FirstRunWizard.tsx` chrome + le OPTIONS/PRESETS di `personalization.ts` (SPECIALTY/OUTPUT/TONE/FOCUS). Le opzioni sono salvate come stringhe IT e alimentano le istruzioni AI → usare una **label-map** (id canonico ↔ label tradotta) per non rompere i valori persistiti.
2. **Prompt frontend**: `prompts/aria.ts` (SYSTEM_PROMPT_IT + variante EN), `prompts/pianoDrafts.ts` (5 prompt EN), `prompts/redaction.ts`, `domain/caseContext.ts` (header), `domain/caseMerge.ts` (header), `draftArtifacts.ts` (DRAFT_LABELS, buildDraftPrompt, warning) — instradare su locale.
3. **Backend**: `ai_service.py` prompt (`_SYSTEM_PROMPT`, `_FLASH/_PRO_POLICY`, `_ANALYSIS_SCHEMA`, chat system, `_build_analysis_user_message`) su `request.language`; aggiungere `language` a `ChatRequest`; error string di `main.py`; `demo_data.py` (3 casi) tradotti e serviti per lingua via `/api/cases?lang=`.
- **Fase 3 — AI prompts + demo**: frontend `prompts/aria.ts` (+ versione EN), `prompts/pianoDrafts.ts` ×5, `prompts/redaction.ts`, `domain/caseContext.ts`, `domain/caseMerge.ts`; backend `ai_service.py` (`_SYSTEM_PROMPT`, `_FLASH/_PRO_POLICY`, `_ANALYSIS_SCHEMA`, chat system) instradati su `request.language`; `main.py` error strings; `demo_data.py` (3 casi, ~2100 righe) tradotti e serviti per lingua; `ChatRequest` → aggiungere campo `language`.

**Pattern da seguire**: `const t = useT();` nei componenti; chiavi puntate (`area.sezione.chiave`); stringhe con grassetto via `renderRich(t('key'))`; nuove chiavi sempre in `it.ts` **e** `en.ts`.

**Nota deploy**: niente PAT GitHub su disco → push al mirror bloccato; la prod va via Vercel CLI (token in `~/.local/share/com.vercel.cli/auth.json`).

---

## ✅ DONE — Login: swap colonne + fix font display (2026-06-25)

- **Swap colonne login** (`.auth-shell`): invertite le due colonne → ora **intro a sinistra, form a destra**. Invertito `grid-template-columns` (`minmax(0,1.05fr) minmax(340px,420px)`) + `grid-column: 1`/`2` su `.auth-intro`/`.auth-col`. Su mobile (≤880px, colonna singola) `grid-column: auto` mantiene l'ordine DOM (form per primo).
- **Fix font sovrapposto** (`--font-display` = Anton): i titoli display lunghi che vanno a capo avevano `line-height < 1` (righe sovrapposte) e `letter-spacing -0.06em` (lettere a contatto col fallback condensato `Arial Narrow` finché Anton non carica). Corretti i due titoli display multi-parola che wrappano: `.auth-intro h1` (`line-height 0.96→1.04`, `letter-spacing -0.06em→-0.01em`) e `.home-headline` (`line-height .95→1.04`). Le altre occorrenze di `--font-display` sono metriche numeriche a riga singola, non toccate.

---

## ✅ DONE — Fix "Configurazione mancante" su Vercel (2026-06-25)

Il deploy di produzione `nightshift` (Vercel) mostrava la schermata **"Configurazione mancante — VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY non impostati"** (da `frontend/src/supabaseClient.ts`): sul progetto era presente solo `VITE_API_URL`.

**Cosa è stato fatto:**
- Recuperati i valori dal progetto Supabase condiviso `plt-alpha` (`coqpqigzjvttsuknersi`) via Supabase MCP: `VITE_SUPABASE_URL = https://coqpqigzjvttsuknersi.supabase.co` + anon key legacy JWT.
- Aggiunte `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` sul progetto Vercel `nightshift` (target production/preview/development) via REST API.
- Rideployato in produzione (le `VITE_*` sono inlineate a build-time → serve un build nuovo, non basta salvare l'env).
- Verificato: il bundle pubblico `https://nightshift-ruby.vercel.app` ora contiene l'URL Supabase → l'app si avvia senza errore.

**Nota sicurezza:** token Vercel CLI (`~/.local/share/com.vercel.cli/auth.json`) usato come Bearer; valutare la rotazione. L'anon key è pubblica per natura (finisce nel bundle client).

---

## ✅ DONE — Pagina Impostazioni (2026-06-08)

Nuova pagina **Impostazioni** dedicata, in stile Nightshift, che consolida tutte le impostazioni prima sparse nel drawer del Profilo più nuove preferenze. Costruita sul branch `nightshift` nel worktree (`/home/deckard/projects/schedapro-nightshift`), in attesa di QA su preview prima del merge. Piano e spec: `docs/superpowers/plans/2026-06-08-settings-page.md`, `docs/superpowers/specs/2026-06-08-settings-page-design.md`.

**Cosa è stato fatto (10 task del piano):**
- **Store preferenze** — nuovo modulo `settings/`: `settingsStore.ts` (`AppPrefs`, `getPrefs`/`setPref`/`subscribePrefs`, chiave per-utente `userKey('app-prefs:v1')`) + `format.ts` (`formatWeight` kg↔lb, `formatLength` cm↔in). `dateUtils.formatDate` ora rispetta la preferenza `dateFormat` (dmy/mdy/iso). Smoke test `check-settings-prefs.mjs` + script `test:settings-prefs`.
- **Routing + shell** — nuova view `'settings'` in `main.tsx` (lazy `SettingsScreen`); `AccountControls` riceve `onOpenSettings`; il drawer del Profilo è ridotto a identità + "Apri Impostazioni" + Logout. `OnboardingWizard` esteso con lo screen `settings`.
- **Sezioni** — `sections/`: Account (email, cambio password via reset email, logout), Profilo/Studio (campi Supabase spostati dal drawer), Aspetto (toggle tema), Aria (modifica configurazione via `FirstRunWizard editMode`, analisi predefinita Flash/Pro, conferma prima di Pro), Unità & formato (peso/lunghezza/formato data/inizio settimana), Privacy & sicurezza (`LockManager` spostato in `lock/LockManager.tsx`, select inattività, anonimizzazione di default, esplicativi 72h + regole anonimizzazione), Dati (esporta tutte le schede, importa `.spr`, svuota chat, reset suggerimenti, rivedi tour, cancella dati locali scoping su `userKey('')`), Aiuto (toggle suggerimenti, rivedi tour, "Cosa fa Aria"), Info (versione via `__APP_VERSION__` iniettata da Vite).
- **Default analisi** — i pulsanti "Analizza con AI" in `CaseDetailView` leggono `getPrefs().defaultAnalysisMode` invece del fisso `'flash'`; il pulsante Pro resta esplicito.
- **Smoke fix** — `check-app-lock.mjs` ripuntato su `LockManager.tsx`/`PrivacySection.tsx`; `check-value-messaging.mjs` ripuntato su `HelpSection.tsx`/`AriaSection.tsx`. Sweep completo verde: `npm run build` 0 errori + 11/11 smoke test.

**Note / deferimenti fase 2:**
- Gli helper `formatWeight`/`formatLength` sono pronti ma **non ancora cablati** in UI: l'app non ha attualmente punti di display numerici peso/lunghezza canonici (le misure stanno in testo libero/analisi). Le preferenze peso/lunghezza persistono per uso futuro. Il formato data invece è già attivo via `dateUtils.formatDate`.
- Non implementati (fase 2): push notifications, cancellazione account, avatar. Link Privacy/Termini omessi in Info (nessun URL reale esistente).
- Resta da fare: **QA in browser in entrambi i temi** (la navigazione browser automatizzata è stata negata in questa sessione); dev server: `cd frontend && VITE_BYPASS_AUTH=true npm run dev -- --port 5175`.

---

## ✅ DONE — Nightshift redesign (2026-06-06)

Full-frontend re-skin to athletic-editorial dark-default + light themes, built on branch `nightshift` in a worktree (`/home/deckard/projects/schedapro-nightshift`), pending live Netlify branch-preview QA before merge to main.

**What was done:**
- **Token rewrite** — `tokens.css` replaced the old "Carta & Inchiostro" bordeaux palette with Nightshift (dark default, lime accent `--accent`, teal AI color `--aria`) + Daylight (light variant). Back-compat aliases (`--sigillo*`, `--giulia*`) were added in T1 and removed in T12.
- **theme.ts + no-FOUC** — `src/theme/theme.ts` manages dark/light/auto; inline `<script>` in `index.html` applies `data-theme` before first paint to prevent flash.
- **Fonts** — Anton SC (display/headlines), Hanken Grotesk (body), JetBrains Mono (metrics/code); Newsreader and Satoshi fully removed.
- **Per-client hero metric** — CaseDetailView shows a prominent hero number (e.g. session count) at the top of each client card.
- **Fitness vocabulary cleanup** — "contraddizioni" → "segnali" in all user-visible copy; legal CSS classes (`.legal-*`) replaced with `.analysis-*`; draft prompt de-legalized; GiulIA/giur class renames throughout.
- **Theme toggle** — dark/light/auto selector in the Profilo drawer; respects `prefers-color-scheme`.
- **Alias cleanup (T12)** — all `var(--sigillo*)` / `var(--giulia*)` references replaced with `var(--accent*)` / `var(--aria*)`; back-compat block removed from `tokens.css`; dead `.legal-panel`/`.legal-section` CSS removed.
- **Smoke test fixes (T12)** — `check-value-messaging.mjs`: updated "contextual hints" check to assert the 2 wired moments (istruzioni modal + drafts section) instead of 3; `check-value-cadence.mjs`: fixed Node ESM resolution for `seen.ts` imports by adding `allowImportingTsExtensions: true` to `tsconfig.json` + `.ts` extension on the `userStorage` import.

**Known limitations (future work):**
- (a) The home/case hero metric falls back to a material/document count because the `CaseSummary` model has no real per-client progress field. A future enhancement should add a progress headline to the summary model and surface it here.
- (b) The "Aula mode" overlay still uses its old hardcoded dark-purple palette (intentionally left; revisit if it clashes with the new design system).

---

## ✅ DONE — localStorage user-scoped + Modifica Aria dal Profilo (2026-06-06)

Tutte le chiavi localStorage ora hanno namespace per `userId` tramite il singleton `src/storage/userStorage.ts` (`setStorageUser(id)` + `userKey(key)` → `spr:{userId}:{key}`). Aggiornati: `seen.ts`, `personalization.ts`, `analysisManager.ts`, `wizardBus.ts`, `ContextualHint.tsx`. `setStorageUser()` chiamato in `useAuth()` ad ogni cambio sessione (login/logout/bypass); `resumePersistedAnalyses()` ritardato a dopo la prima risoluzione della sessione. `finalizeAuthSuccess` accetta `userId` opzionale per chiamare `clearLoginOptOuts()` sull'utente corretto. `FirstRunWizard` ora accetta `editMode`, `initialValues`, `onComplete`: in edit mode salta disclaimer e `recordAcceptance`, mostra titolo "Aggiorna configurazione Aria" e precompila i campi. `AccountControls`/`ProfileDrawer` aggiunto bottone "Modifica configurazione Aria" che apre il wizard in edit mode. Test: 27/27 `test:value-messaging` ✓, 11/11 `test:auth-onboarding` ✓, `npm run build` zero errori. Pushato su `main`.

Handoff: i follow-up del giro precedente (storage user-scoped + modifica Aria) sono **completati**. Rimane: sessione di validazione col trainer reale + triage attriti.

### Patch 2026-06-06b — rinomina chiavi `plt_*` → `spr:*`, pulizia chat al logout

Tutte le chiavi legacy `plt_*` nelle chiavi localStorage/sessionStorage sono state rinominate al prefisso `spr:`:
- `plt_chat_messages` → `spr:chat-messages` (localStorage, `main.tsx`)
- `plt_fab_hidden` → `spr:fab-hidden` (sessionStorage, `main.tsx`)
- `plt_tasks` → `spr:tasks` (`CaseDetailView.tsx`)
- `plt_redaction_rules` → `spr:redaction-rules` (`CaseDetailView.tsx`)

Aggiunto in `main.tsx`:
- `localStorage.removeItem('spr:chat-messages')` nel gestore `SIGNED_OUT` → la chat non persiste tra sessioni diverse.
- `useEffect` in `App` che resetta lo stato chat in-memory (`messages`, `open`, `caseContext`, `activeCaseId`) quando `session` diventa `null` → nessun residuo di messaggi al logout.

Commit: `afc66dda6`. Build: zero errori TypeScript.

### Patch 2026-06-06c — bugfix wizard + cleanup

- Risolti errori TypeScript su Netlify: `AiInstructionsModal.tsx` e `MultiFileUploadDrawer.tsx` modificati da Codex ma mai committati — build Netlify falliva su tipi `initialInstructions` e `onAnalyze`. Committati insieme a `supabaseClient.ts` (bypass senza env) e `check-auth-onboarding.mjs` (9 check aggiuntivi).
- Fix stile wizard Aria: i token del design system erano in light-mode; il modale hardcoda colori scuri ma chip e input ereditavano `--paper-sunken: #F0EADD` (beige). Aggiunto `color-scheme: dark` + override token dentro `.value-modal`; `row-gap` chip 7px → 10px.
- Rimosso il `ContextualHint` "Chiedi ad Aria qualsiasi cosa su questo cliente…" dalla home (ridondante con la `AriaPromptBar`).
- Fix bug `OnboardingWizard`: i passi `inDrawer: true` apparivano su qualsiasi scheda cliente anche a drawer chiuso. La guardia era asimmetrica: nascondeva i passi normali durante il drawer ma non nascondeva i passi inDrawer quando il drawer era chiuso. Fix: `(step.inDrawer ? !suppressed : suppressed)`. Commit: `97cd6b85c`.
- Aggiornati README.md, CURRENT-TASK.md, AGENTS.md.

---

## ✅ DONE — Aria personalization made visible in the workflow (2026-06-06)

Rev3 del sistema valore: meno pannelli, più prova nel flusso reale. Il vecchio wizard valore ricorrente è stato sostituito da un setup compatto di Aria (`src/value/FirstRunWizard.tsx` + `src/value/personalization.ts`) che salva stile trainer, output preferito e tono; queste preferenze vengono incluse in analisi e bozze tramite `combineAriaInstructions()`. La creazione cliente ora raccoglie subito obiettivo, disponibilità e “cosa deve tenere d'occhio Aria”, salvandoli nel contesto della scheda. Il drawer upload mostra una preview inline “Personalizzazione pronta” con segnali utilizzabili e focus chip; il modale pre-flight è diventato “Focus di Aria” con preset operativi. La scheda cliente mostra una strip “Aria ha/può personalizzare usando…” per rendere espliciti i dati usati. Rimossa la modale post-upload “comincia la magia” perché spiegava invece di dimostrare. Test: `npm run test:value-messaging`, `npm run test:value-cadence`, `npm run build`; backend focused: `.venv/bin/python -m pytest tests/test_user_instructions.py -q` e `tests/test_frontend_copy.py -q` verdi. Full backend suite non completata in sandbox: wrapper `.venv/bin/pytest` punta ancora al vecchio venv PLT e i run via `.venv/bin/python -m pytest tests/ -q` / `test_analysis_jobs.py` sono rimasti appesi senza output, poi fermati con `pkill -f pytest`.

### Patch 2026-06-06 — login unblock + setup Aria più flessibile

Login: `supabaseClient.ts` ora non richiede le env Supabase quando `VITE_BYPASS_AUTH=true` su localhost; il suggerimento login è diventato inline/non bloccante invece di overlay sopra il form; il controllo profilo post-login usa `maybeSingle()` e in caso di errore apre l'onboarding profilo invece di lasciare l'app bloccata. Setup Aria: domanda 1 ha “Altro” con input libero; domanda 2 permette risposte multiple + “Altro”; domanda 3 ha più stili (`Empatico`, `Sintetico`, `Educativo`, `Molto pratico`). Test: `npm run test:auth-onboarding`, `npm run test:value-messaging`, `npm run build`.

Patch extra: il login reale poteva salvare la sessione Supabase senza aggiornare lo stato React finché l'utente non ricaricava la pagina. `useAuth()` ora ascolta anche un evento locale `schedapro:auth-session-refresh`; dopo `signInWithPassword`/`signUp` riusciti, `AuthScreen` emette l'evento e forza `getSession()`, quindi l'app passa subito dalla login alla home.

Patch extra 2: `VITE_BYPASS_AUTH=true` su localhost mascherava il flusso reale: in incognito l'app entrava già con sessione finta e, dopo logout, `useAuth()` non gestiva bene il ritorno a una sessione reale. Ora il bypass è solo fallback: se Supabase ha una sessione reale usa quella; se l'utente fa logout in dev, salva `schedapro:dev-bypass-signed-out` in `sessionStorage` e non ricrea subito la sessione finta; al login reale rimuove il flag e rilegge `getSession()`.

Patch extra 3: la home local-first conserva l'avviso “Backend non raggiungibile e nessuna scheda locale” quando il backend demo non è attivo e non ci sono schede locali, perché è diagnostico utile. Il setup Aria però è stato separato da backend e suggerimenti generici: se non esiste una configurazione Aria completa salvata, il pannello si apre anche con backend non raggiungibile e anche se vecchi flag “seen”/opt-out/suggerimenti lo avrebbero soppresso.

Handoff prossimo giro: due follow-up importanti. Primo, separare davvero i DB/localStorage per utente sullo stesso computer: oggi molte chiavi sono globali del browser o hanno eredità `plt_*`; creare namespace per `session.user.id`/owner e verificare IndexedDB, analysis jobs, chat, lock/PIN, setup Aria e preferenze UI, così logout/login tra trainer diversi non mescola schede o preferenze. Secondo, aggiungere un link esplicito nel Profilo/Account per “Modifica configurazione Aria”: deve riaprire lo stesso setup, caricare `spr:aria-setup:v1`, permettere modifica e salvare di nuovo, senza dover cancellare localStorage a mano.

---

## ✅ DONE — Blocco con PIN + biometria (2026-06-03)

Cancello locale (`src/lock/`) sopra la sessione Supabase, per proteggere i dati local-only del cliente su device perso/condiviso. **PIN a 4 cifre** (hash PBKDF2, mai in chiaro) + **biometria WebAuthn opzionale**; blocco all'avvio e dopo inattività/background; recupero via re-login (niente cifratura at-rest → nessun rischio perdita dati); gestione da Profilo. Warm-up ping invariato. Design-of-record nel gemello PLT (`docs/superpowers/specs/2026-06-03-app-lock-pin-design.md`). Commit: Fase 1 `bdae9f4d3`, Fase 2 `fa9228fd0`. Test: `npm run test:app-lock`. ✅ PIN verificato live su Netlify.

---

## ✅ DONE — Comunicazione del valore di Aria + sistema a pannelli (2026-06-03)

L'app si sottovendeva al primo impatto. Nuovo modulo `src/value/`. **v1:** hint contestuali a FAB Aria / istruzioni aggiuntive / bozze, sezione «Cosa fa Aria» + **interruttore globale dei suggerimenti** nel Profilo (non tocca il login), copy login (headline differenziata, 4 proof-point) + tour + invito tester. **rev2 (sistema a pannelli):** `PanelModal` (shell riusabile, **clic sul backdrop = chiude** così non si resta intrappolati sul velo) + `FirstRunWizard` (wizard sequenziale al primo avvio: benvenuto → come usare Aria → privacy → avviso+checkbox, **sostituisce ValueIntroModal**) con **cadenza oraria** + «Esci per ora»/«Non mostrare più» (opt-out fino al login); la **checkbox dell'avviso è sempre obbligatoria** per superare l'ultimo pannello; `InfoPanelModal` contestuale (primo caso: post-upload «comincia la magia»); `overlayGate` (il **tour spotlight si mette in pausa** mentre un pannello è aperto, niente deadlock; backdrop pannelli a z-index 10002 sopra il tour); bottone **«Logout» sulla pagina PIN**; **creazione cliente → apre subito l'upload drawer** e il tour evidenzia il bottone «Aggiungi» dentro il drawer (`586d59626`). Spec rev2 + plan in `docs/superpowers/`. Test `npm run test:value-messaging` (17 check) + `test:value-cadence`. Commit v1 `097dc9a4a`→…; rev2 `15b13645f`→`c06fce350` (Task1-4 eseguiti da agente /btw; poi PIN-logout, checkbox sempre obbligatoria, overlay-gate, backdrop-dismiss). Da portare a PLT (`docs/port-login-to-plt.md` §11). ⏳ QA live su Netlify dopo deploy (**hard-refresh per la cache PWA**).

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
- [x] **Local storage per utente:** ✅ fatto (2026-06-06) — `userStorage.ts` + namespace `spr:{userId}:*` su seen, personalization, analysisManager, wizardBus.
- [x] **Modifica setup Aria dal Profilo:** ✅ fatto (2026-06-06) — bottone nel ProfileDrawer, `FirstRunWizard` in edit mode.
- [ ] **Sessione di validazione col trainer pronto** — far usare l'app, raccogliere 3 attriti + must-fix + segnale di valore (template in `05-validation/`).
- [ ] Triage + fix rapidi emersi dalla sessione (commit/push su `chiantera/schedapro`).

### Prossimo (post-test)
- [x] ~~**Comunicare il valore di Digital Trainer**~~ — fatto (vedi sezione DONE in cima: value messaging v1 + sistema a pannelli rev2). Resta solo la copy Play Store come bozza (`06-brand/play-store-testing-copy.md`).
- [ ] **Login biometrico (WebAuthn) — da sistemare:** lo sblocco biometrico necessita lavoro/verifica (gated su platform authenticator ma non rifinito). Per ora il PIN è la strada affidabile.
- [x] ~~Onboarding trainer più ricco al primo accesso~~ — fatto come setup Aria + dati iniziali cliente (vedi DONE 2026-06-06).
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
