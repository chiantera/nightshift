# Port back to PLT — login page, account controls, AI-instructions modal

Changes made to SchedaPRO (2026-06-01 through 2026-06-06) that we want to port **back to PLT**
(`/home/deckard/projects/plt/alpha-pwa/`). SchedaPRO was forked from PLT, so the
`AuthScreen` / `useAuth` / analyze / draft structure is shared — these should drop
in with only brand/copy changes (Digital Trainer → PLT, Aria → GiulIA, fitness → legale).

Reference commits in `chiantera/schedapro` (chronological):
- `c6167e97d` — full login page (disclaimer+checkbox, AuthTour, layout swap, hero, logout fix)
- `ffeeb99af` — top-align login columns
- `b2002e146` — AccountControls (Profilo + quick Logout) everywhere + AriaPromptBar/upload UX
- `ceaf6d436` — pre-flight "istruzioni per Aria" modal before analyze/draft (+ backend `user_instructions`)
- `ef949a9e5` — background analysis jobs (survives navigation / phone-lock / refresh)
- `12ee6f7e3` — "Ri-analizza" made non-destructive + routed through the modal
- 2026-06-06 working slice — login state refresh after real auth, dev-bypass no longer masks real auth,
  signup enters the app immediately, non-blocking login help, workflow-visible AI personalization setup.

Sections below map each piece to files + adaptation notes. Login code is inline in
`frontend/src/main.tsx`; account controls in `components/AccountControls.tsx` +
`supabaseClient.ts`; the AI modal in `components/AiInstructionsModal.tsx` + wiring in
`screens/CaseDetailView.tsx` + backend `app/models.py`/`app/ai_service.py`. CSS in `styles.css`.

> Note: the `frontend/scripts/check-*.mjs` smoke tests were migrated off PLT copy in this
> session too (`.plt`→`.spr`, GiulIA→Aria, new TabId, `requestDraft` wiring); the deeply
> legal `check-layout-and-contrast-css.mjs` was removed. PLT keeps its own originals — no port.

---

## 1. Disclaimer with mandatory checkbox ✅ (the key piece)

A warning card (professional responsibility + privacy) with a "Ho letto e
compreso" checkbox that **gates** the submit button until ticked.

- **State:** `const [accepted, setAccepted] = useState(false);` in `AuthScreen`.
- **Guard:** `handleSubmit` returns early `if (!accepted) return;`
- **Submit button:** `disabled={loading || !accepted}`.
- **Markup:** `.auth-disclaimer.auth-disclaimer--card` (role="note") containing two
  `<p>` (⚠️ Importante / 🔒 Privacy) + a `<label className="auth-accept">` wrapping
  the checkbox; plus `{!accepted && <p className="auth-accept-hint">Spunta la casella…}`.
- **CSS:** `.auth-disclaimer`, `.auth-disclaimer--card`, `.auth-accept`,
  `.auth-accept-hint` in `styles.css`.

**Port note:** domain-independent. Only replace the warning copy with PLT's legal
wording (no medical disclaimer; keep the "non sostituisce il giudizio di un
professionista / DA VERIFICARE" spirit and the privacy/anonimizzazione line).

---

## 2. AuthHelp — non-blocking login helper ✅ (supersedes AuthTour)

The original SchedaPRO port note used a blocking `AuthTour` modal on the login page. That
proved too fragile: it could cover the auth form and make testers think login was broken.
Current SchedaPRO uses a small inline helper instead.

- **Component:** `AuthHelp` (just above `AuthScreen`), rendered inside `.auth-col` before
  the disclaimer card.
- **Persistence:** `const AUTH_TOUR_KEY = 'schedapro:auth-tour:dismissed';` is still used,
  but only to hide this inline helper. It does **not** cover the form.
- **CSS:** `.auth-help`, `.auth-help-close`; remove/avoid `.auth-tour-backdrop` on the
  login page.
- **Behavior:** close hides for the current render; checking "Non mostrare più" writes
  the dismiss key. The warning checkbox still gates submit.

**Port note:** for PLT, use `plt:auth-tour:dismissed` or keep PLT's existing auth-help key,
but port the **inline** helper, not the old full-screen modal. Rebrand copy for GiulIA/legal
context and keep it short: read warning → tick checkbox → access/sign up.

---

## 3. Two-column login layout, top-aligned ✅

Warning + sign-in card on the **left**, intro/hero on the **right**; columns
**top-aligned** (not vertically centered); collapses to one column under 880px.

- **CSS** (`styles.css`):
  ```css
  .auth-shell { display: grid;
    grid-template-columns: minmax(340px, 420px) minmax(0, 1.05fr);
    gap: clamp(18px, 4vw, 42px); align-items: start; }   /* start, not center */
  @media (max-width: 880px) { .auth-shell { grid-template-columns: 1fr; } }
  ```
- **DOM order** in `AuthScreen`: `.auth-col` (disclaimer + auth-card) **first**,
  `section.auth-intro` (hero) **second**. On mobile this stacks warning-first.

**Port note:** portable 1:1. (`align-items: start` is the fix for the warning box
being vertically centered against the tall hero — it should start at the hero's line.)

---

## 4. Auth state fixes — dev bypass, real login refresh, signup ✅

The simple `SIGNED_OUT` listener was not enough. In SchedaPRO, `VITE_BYPASS_AUTH=true`
could still mask real auth in localhost/incognito, and successful real login sometimes
stored the Supabase session without advancing React until refresh.

Current pattern:
- `DEV_BYPASS_AUTH` is only a **fallback** when there is no real Supabase session.
- `useAuth()` always calls `supabase.auth.getSession()` first.
- If a real session exists, use it and clear the dev-bypass signed-out flag.
- If no real session exists and dev bypass is enabled, create the fake session only when
  `sessionStorage.getItem(DEV_BYPASS_SIGNED_OUT_KEY) !== '1'`.
- On `SIGNED_OUT`, set `DEV_BYPASS_SIGNED_OUT_KEY` and `setSession(null)` so logout really
  lands on the login page.
- After successful `signInWithPassword` or `signUp`, `AuthScreen` calls `finalizeAuthSuccess(userId?)`:
  `setStorageUser(userId)` (if provided), `recordAcceptance()`, `clearLoginOptOuts()`, remove the
  dev-bypass signed-out flag, then dispatch `schedapro:auth-session-refresh`; `useAuth()` listens
  for that event and re-runs `getSession()`. The `userId` is captured from the login/signup response
  so `clearLoginOptOuts()` clears the right user's opt-outs even before the session state propagates.
- Signup now enters the app immediately: after `signUp`, if `signupData.session` is missing,
  call `signInWithPassword({ email, password })`, then `finalizeAuthSuccess()`.
- `supabaseClient.ts` should not require real Supabase env vars when local dev bypass is enabled;
  use placeholder URL/key only in bypass.

**Port note:** PLT likely has the same local-dev trap. Port the full pattern, not only the old
logout listener. Rename event/key prefixes to `plt:*` where appropriate.

---

## 5. AccountControls — Profilo + quick Logout on every screen ✅

A reusable button pair (Profilo + Logout) shown top-right on **both** the home
header and the case-detail top bar. Both buttons share the `.profile-btn`
look/size. Logout asks for confirmation, then signs out **without** going through
the Profilo drawer.

- **New module:** `frontend/src/components/AccountControls.tsx` — exports
  `AccountControls({ session })`; contains the moved `ProfileDrawer` and a shared
  `requestLogout()` (`if (confirm('Vuoi davvero uscire dall'account?')) supabase.auth.signOut()`).
- **New module:** `frontend/src/supabaseClient.ts` — the supabase client extracted
  out of `main.tsx` (incl. the missing-env-vars guard) so `AccountControls` and any
  screen can import it without a circular dep on `main.tsx`.
- **Usage:** `<AccountControls session={session} />` in the home header (`main.tsx`)
  and in the case-detail top bar (`CaseDetailView.tsx`, inside a new `.case-topbar`
  flex row: back-button left, controls right).
- **CSS:** `.case-topbar`, `.account-controls` in `styles.css` (reuses `.profile-btn`).

**Port note:** PLT still has `ProfileDrawer` + supabase client inline in `main.tsx`.
Extract the client to `supabaseClient.ts`, move `ProfileDrawer` into an
`AccountControls.tsx`, add the quick logout button + confirm, and drop
`<AccountControls/>` into PLT's home header and the case-detail back-button line.
Only copy changes (UserProfile fields are PLT-specific: studio/palestra → studio legale).

## 6. Other small UX changes ported alongside

- **Inline Aria/GiulIA prompt bar:** placeholder vertically centered
  (`align-items: center`, drop the `flex-end`/padding overrides in
  `AriaPromptBar.tsx`); PLT's equivalent is `prompts/giulia.ts` bar.
- **Upload drawer autofocus:** `MultiFileUploadDrawer` focuses the paste textarea
  on mount (`pasteRef.current?.focus({ preventScroll: true })`) so the user can type
  immediately. Portable 1:1 to PLT's upload drawer.

## 7. Pre-flight "istruzioni per Aria" before non-chat AI actions ✅ (major)

Before Analizza / Crea bozza (and any future non-chat AI summon — **not** the inline
Aria bar or the FAB chat), a small modal collects OPTIONAL free-text instructions
that steer the response. One-shot (empty each time).

- **New component:** `frontend/src/components/AiInstructionsModal.tsx` — reusable,
  driven by one state value: `pendingAi: AiInstructionsRequest | null`
  (`{ title, actionLabel, run: (instructions) => … }`). ⌘/Ctrl+Invio = procedi, Esc = annulla.
- **CSS:** `.ai-instr-*` in `styles.css`.
- **Host wiring (`CaseDetailView.tsx`):** `requestAnalyze(mode)` and
  `requestDraft(type, title, extraInstruction)` open the modal, then call the real
  `handleAnalyze(mode, instr)` / `handleOpenDraftWorkspace(type, title, extra, instr)`.
  All Analizza buttons + the drawer's `onAnalyze` + `onOpenDraft` route through these.
  The old Pro `confirm()` is **removed** — the modal's "Avvia Pro" button is now the
  explicit Pro confirmation (satisfies the explicit-confirm policy).
- **Analyze path (backend):** `AnalyzeRequest.user_instructions: str | None` in
  `models.py`; `ai_service._build_analysis_user_message()` weaves a
  `ISTRUZIONI DEL TRAINER (…senza mai violare le regole sottostanti)` block above the
  materials, **below** the no-inventing guardrail. Tests: `tests/test_user_instructions.py`.
- **Draft path (frontend only):** `handleOpenDraftWorkspace` appends a trainer block
  to the prompt tail; no backend change (draft prompts are built client-side).

**Port note:** PLT has the same analyze (`/api/analyze-text` + `ai_service`) and draft
flow (`buildDraftPrompt`, `handleOpenDraftWorkspace`) — port the modal + the
`requestAnalyze`/`requestDraft` wrapping + the backend `user_instructions` field
verbatim, adapting copy (trainer → avvocato). Candidate to extend to PLT's
`Anonimizza`/redaction-detect summon if desired (we scoped to analyze+draft here).

## 8. Background analysis that survives navigation / phone-lock / refresh ✅

The analysis used to live inside `CaseDetailView`, so leaving the screen unmounted
it and the progress/result were lost. Now it runs as a backend **job** owned by an
app-level manager, independent of any mounted screen.

- **Backend:** `POST /api/analyze-jobs` runs `analyze_case` in a `ThreadPoolExecutor`
  and returns `{ job_id }` immediately; `GET /api/analyze-jobs/{id}` returns
  `{ status: running|done|error, result?, error? }`. In-memory job store with a 1h TTL
  (`app/main.py`); models `AnalyzeJobCreated`/`AnalyzeJobStatus`. Tests:
  `tests/test_analysis_jobs.py`. (Old synchronous `/api/analyze-text` kept.)
- **Frontend manager:** `src/analysis/analysisManager.ts` — `startAnalysis`,
  `abortAnalysis`, `dismissAnalysis`, `getAnalysisState`, `useAnalysisState`,
  `useAnalysisTick`, `resumePersistedAnalyses`. POSTs the job, persists `job_id`
  to `localStorage` (`schedapro:analysis-jobs`), polls every 2s, re-pokes on
  `visibilitychange` (phone unlock / tab refocus), and **on completion merges the
  result into the freshest IndexedDB copy itself** (so it's never lost). Pub/sub via
  `useSyncExternalStore`.
- **CaseDetailView:** `handleAnalyze` now calls `startAnalysis`; `analyzing` derives
  from `useAnalysisState(caseId)`; a completion effect reloads the case from IndexedDB
  on `done` / toasts on `error`; the banner's abort calls `abortAnalysis`.
- **App + list:** `resumePersistedAnalyses()` on mount; list refreshes when the running
  count drops; per-card "Analisi in corso…" pill (`getAnalysisState` + `useAnalysisTick`).

**Port note:** PLT has the identical synchronous analyze flow — port the job endpoints
+ the manager + the CaseDetailView wiring verbatim. Caveat (documented for Deckard):
in-memory jobs are lost on a Render cold start mid-job; the client then gets a 404 and
shows "Analisi interrotta sul server. Riprova." To make it bulletproof, persist job
state to Supabase (out of scope for now).

### 8b. "Ri-analizza" is non-destructive ✅

PLT's "Ri-analizza" was (and SchedaPRO's was) a one-click **destructive reset** that
wiped the analysis (summary/materials/timeline/…) before re-running — it could delete
the lawyer's/trainer's own edits. Fixed: the button now routes through the pre-flight
modal (= the confirmation step) and runs a **full** re-analysis (`handleAnalyze(mode,
instr, { full: true })`) over all documents. `mergeWithAi` already preserves user edits
(case_summary, manually-added items via dedup, livello_attenzione) and `raw_documents`
are kept — nothing is deleted. Port the `requestReanalyze` + `opts.full` change and drop
the destructive inline reset onClick.

---

---

# Newer additions (2026-06-03 session) — to port to PLT

These were built **after** the 2026-06-01 batch above. Same fork structure, so they drop in
with brand/copy changes (Digital Trainer → PLT, Aria → GiulIA, fitness → legale).

## 9. App-lock (PIN + biometria) — ALREADY ON BOTH (no port needed)

The `src/lock/` app-lock (PIN PBKDF2 + optional WebAuthn biometric, lock on cold-start/idle,
re-login recovery) was implemented on **both** apps in this session — design-of-record in PLT
(`docs/superpowers/specs/2026-06-03-app-lock-pin-design.md`). Nothing to port. Open item on
both: biometric unlock still needs work (PIN is the reliable path).

## 10. Force re-acceptance of the warning every 72h (auto-logout) ✅ — port to PLT

A hard session lifetime: the user must re-tick the disclaimer checkbox (and re-login) at least
every 72h. Supabase sessions don't expire on their own, so we force a `signOut()` when the last
acceptance is older than the TTL.

- **New module:** `frontend/src/auth/sessionExpiry.ts` — `SESSION_TTL_MS = 72h`,
  `recordAcceptance()`, `ensureAcceptanceTs()`, `isSessionExpired()`, `clearAcceptance()`.
  Stores `Date.now()` in localStorage (`spr:session-accepted-ts`). Missing ts → not expired
  (we grandfather existing sessions via `ensureAcceptanceTs`, so nobody is logged out by surprise).
- **Login wiring (`main.tsx` `AuthScreen.handleSubmit`):** call `recordAcceptance()` right after a
  successful `signInWithPassword` / `signUp` (the checkbox is mandatory to submit, so login ⇒ accept).
- **App effect (`main.tsx` `App`):** when `session` is truthy, run a check — `isSessionExpired()` →
  `clearAcceptance()` + `supabase.auth.signOut()`; else `ensureAcceptanceTs()`. Re-checked on
  `visibilitychange` (so a long-backgrounded session also logs out on refocus).
- **Test:** `frontend/scripts/check-session-expiry.mjs` (runtime, localStorage shim);
  `npm run test:session-expiry`.

**Port note:** domain-independent. Change the localStorage key `spr:` → `plt:`, drop the same
module + login `recordAcceptance()` + the `App` effect into PLT's `main.tsx`. (Being applied to
PLT in this same session — verify it landed.)

## 11. Value messaging — Aria differentiator ✅ (shipped in SchedaPRO; port AFTER live validation)

Problem: the app under-sells itself at first open ("just another client tracker"); the
differentiator (Aria + deep personalization) is invisible. Built **SchedaPRO-first** (shipped
2026-06-03, commits `097dc9a4a`→`8402d81bd`); port to PLT once validated live.

- **Spec:** `docs/superpowers/specs/2026-06-03-digital-trainer-value-messaging-design.md`
- **Plan:** `docs/superpowers/plans/2026-06-03-digital-trainer-value-messaging.md`
- **New `src/value/` module:** `seen.ts` (one-time flags + global suggestions on/off),
  `AriaCapabilities.tsx` (shared value content), `ValueIntroModal.tsx` (one-time first-launch
  modal, before the tour), `ContextualHint.tsx` (one-time inline hints), `value.css`.
- **Surfaces:** login copy rewrite (lead with the differentiator, not the generic headline);
  enriched onboarding tour copy (explain the *why*); contextual hints at FAB / istruzioni
  aggiuntive / bozze; «Cosa fa Aria» section + **global suggestions toggle** in the Profilo drawer.
- **Tests:** `frontend/scripts/check-value-messaging.mjs` (`npm run test:value-messaging`) + updated
  `check-auth-onboarding.mjs`.

**rev 2 — panel system (shipped, commits `15b13645f`→`c06fce350`):** `seen.ts` extended
with cadence/opt-out helpers (`shouldShowHourly`, `getLastShown`/`markShown`, `optOutUntilLogin`/
`isOptedOut`, `clearLoginOptOuts`). New modules in `src/value/`:
- `PanelModal.tsx` — reusable shell (dark backdrop + card). **Clicking the backdrop dismisses**
  (`onBackdrop`, fired only when `e.target === e.currentTarget`) so the user is never trapped on the
  veil that covers the UI. (Fix `c06fce350` — without it, a fresh login showed a full-screen
  blocking backdrop with no way out by tapping the dark area.)
- `FirstRunWizard.tsx` — sequential first-run wizard (welcome → how-to → privacy → warning+checkbox;
  **replaces ValueIntroModal**; hourly cadence; «Esci per ora»/«Non mostrare più»). The
  **warning checkbox is ALWAYS required** to pass the last panel («Iniziamo» disabled until ticked);
  ticking calls `recordAcceptance()` (refreshes the 72h window). Backdrop-click = `exitForNow`.
- `InfoPanelModal.tsx` — per-trigger contextual panel (exit + opt-out-until-login; backdrop-click =
  `onClose`); first instance = post-upload "comincia la magia" in CaseDetailView.
- `overlayGate.ts` — ref-counted pub/sub (`openOverlay`/`closeOverlay`/`useAnyOverlayOpen`). The
  `OnboardingWizard` spotlight tour **pauses (returns null) while any value panel is open**, so the
  tour and a panel never overlap into a deadlock; `value-modal-backdrop` z-index is **10002** (above
  the tour's 10000/10001). Effect: post-upload panel shows, then the tour resumes on the analyze step.

Login `handleSubmit` also calls `clearLoginOptOuts()`. **PIN LockScreen** gets an `onLogout` →
`signOut()` «Logout» button (escape hatch). Tests: `npm run test:value-cadence` (runtime) + extended
`check-value-messaging.mjs`.

**Create→upload flow (commit `586d59626`):** creando un cliente si va **dritti all'upload drawer**.
`handleCreate` chiama `onSelect(id, { openUpload: true })`; `handleSelectCase` salva `autoUploadCaseId`;
`CaseDetailView` riceve `autoOpenUpload`/`onAutoUploadConsumed` e all'avvio apre il drawer
(`setShowUpload(true)` + `wizardBus.emit('upload-opened')`). Lo step del tour `add-doc` è ora
`inDrawer: true` con `selector: '[data-tour="add-in-upload"]'` → fa **spotlight del bottone «Aggiungi»
dentro l'upload box** (`MultiFileUploadDrawer`, il bottone `onAddTextItem`), non più del bottone
«Aggiungi documento» nella scheda. Port note: in PLT cabla lo stesso flag `openUpload` + il
`data-tour="add-in-upload"` sul bottone equivalente del drawer.

**Port note:** all domain-independent UI + copy. For PLT, rebrand Aria → GiulIA and rewrite the
proof-points to the legal wedge (case triage, source-linked timelines, draft prep, DA VERIFICARE
for precedents — **never** claim verified Cassazione citations). Port the panel system + cadence
helpers + overlay gate + backdrop-dismiss + PIN-logout verbatim (change `spr:` keys → `plt:`). Keep
the global suggestions toggle and the 72h auto-logout interplay (login page excluded from the toggle).
**Watch out:** the value-panel backdrop z-index (10002) must stay above PLT's onboarding tour z-index,
and the tour must pause via `useAnyOverlayOpen()` — otherwise the deadlock/blocking-veil bugs recur.

**rev 3 — workflow-visible personalization (SchedaPRO 2026-06-06):** the validation concern changed:
panels explained Aria, but testers needed to see personalization during real work. SchedaPRO now
uses `src/value/personalization.ts` for saved AI preferences and replaces the first-run value wizard
with a compact setup (`FirstRunWizard`) that stores trainer specialties, preferred output format and
tone. `AiInstructionsModal` is now a "Focus di Aria" control with preset chips; upload shows an inline
"Personalizzazione pronta" preview with focus chips; the case hero shows a "Aria ha/può personalizzare
usando..." evidence strip. The post-upload InfoPanel was removed from the active flow.

Implementation details to port/adapt:
- `src/value/personalization.ts` owns the saved setup (`spr:aria-setup:v1`), option lists,
  focus presets, `loadAriaSetup()`, `saveAriaSetup()`, `ariaSetupLabels()`,
  `buildTrainerPreferenceInstructions()`, and `combineAriaInstructions()`.
- `FirstRunWizard` is now required setup, not a generic suggestion. Its eligibility should be
  based on `!hasCompleteAriaSetup()` only. Do **not** suppress it with `areSuggestionsEnabled()`,
  `isOptedOut()`, old `seen` flags, or backend reachability. If no complete setup exists, the
  panel opens even when the backend warning is visible.
- The saved setup is considered complete when it has at least one output style and a tone. It can
  include zero specialties, because a trainer/lawyer may choose only format + tone.
- The old `seen` key may still be written for compatibility, but it should not decide whether
  setup appears. The source of truth is the saved setup object.
- `AiInstructionsModal` should combine one-shot user instructions with saved preferences via
  `combineAriaInstructions()` before analyze/draft calls.
- Upload/new-case surfaces should make personalization visible inside the workflow instead of
  explaining it in a separate post-upload panel.

**PLT port note for rev 3:** port the mechanics, not the copy. Legal equivalents would be lawyer/case
preferences, focus chips such as `rischi`, `timeline`, `atti da preparare`, `fonti`, `contraddizioni`,
and an evidence strip like "GiulIA sta usando: documenti, cronologia, scadenze, questioni aperte,
preferenze dello studio". Keep the legal guardrails (`DA VERIFICARE`, no invented citations) in the
modal copy and prompt composition. Use a PLT-scoped key such as `plt:giulia-setup:v1`; if PLT keeps
an existing key, document it and avoid reusing SchedaPRO's `spr:aria-setup:v1`.

### 11b. Per-user local data namespaces ✅ done in SchedaPRO (2026-06-06) — port to PLT

SchedaPRO now scopes all user-specific localStorage keys per `session.user.id`.

**Implementation in SchedaPRO:**
- New singleton `src/storage/userStorage.ts` — `setStorageUser(id: string)` sets the current user
  (default `'anon'`); `userKey(key: string)` returns `spr:{userId}:{key}`.
- `setStorageUser()` is called in `useAuth()` before `setSession()` in every branch
  (`getSession`, `onAuthStateChange`, catch fallbacks) and in `finalizeAuthSuccess(userId?)` at login
  so `clearLoginOptOuts()` always operates on the right user's keys.
- `resumePersistedAnalyses()` is now deferred to after the session first resolves (via a
  `sessionResolved + didResumeRef` guard) so it reads the correct per-user analysis-jobs key.
- Updated modules: `seen.ts`, `personalization.ts` (`aria-setup:v1`), `analysisManager.ts`
  (`analysis-jobs`), `wizardBus.ts` (`onboarding:dismissed`), `ContextualHint.tsx` (key prefix).
- IndexedDB (`db.ts`) and PIN/lock (`appLock.ts`) were already user-scoped — no changes needed.
- **Not scoped (remaining):** `plt_chat_messages`, `plt_fab_hidden` (legacy keys, out of scope for now).

**PLT port note:**
- Copy `src/storage/userStorage.ts` verbatim (rename `spr:` prefix to `plt:` inside `userKey`).
- Call `setStorageUser(session.user.id)` in PLT's `useAuth()` the same way; call
  `setStorageUser('anon')` on `SIGNED_OUT`.
- Update PLT equivalents of `seen.ts`, `personalization.ts` (if it exists), `analysisManager.ts`,
  `wizardBus.ts` to import `userKey` and wrap their localStorage calls.
- `clearLoginOptOuts()` already iterates by prefix — it will automatically clear the right user's
  keys once `setStorageUser()` is in place.
- Test: login as user A → create data/setup → logout → login as user B → confirm B has no
  trace of A's AI setup, analysis jobs, hint dismissals, or onboarding state.

### 11c. Edit saved AI setup from Profile/Account ✅ done in SchedaPRO (2026-06-06) — port to PLT

**Implementation in SchedaPRO:**
- `FirstRunWizard` now accepts `editMode?: boolean`, `initialValues?: AriaSetup`,
  `onComplete?: () => void`.
- In `editMode`: skips the disclaimer checkbox (pre-accepted), shows title "Aggiorna configurazione
  Aria", starts with all fields preloaded from `initialValues`, hides "Salta per ora" footer, calls
  `onComplete()` after save (no `recordAcceptance()` or `markSeen()` called).
- `AccountControls` / `ProfileDrawer` gains a "Modifica configurazione Aria" button (below
  `LockManager`, above "Cosa fa Aria"). Click: closes the profile drawer, opens `FirstRunWizard`
  with `editMode + initialValues={loadAriaSetup() ?? undefined}`. On complete: wizard closes, user
  is back on the main screen.

**PLT port note:**
- Port the three new props on `FirstRunWizard` (or PLT's equivalent first-run setup component).
- Add the edit button in PLT's `ProfileDrawer` / account panel near the "Cosa fa GiulIA" section.
- Call `loadAriaSetup()` (or PLT's equivalent) at click time to read fresh values.
- Rename copy: "Modifica configurazione GiulIA"; key: `plt:{userId}:giulia-setup:v1` (or whatever
  PLT settles on after §11b is ported).
- No backend changes needed — setup is frontend-only.

---

## NOT to port (SchedaPRO-specific)

- Hero 6-feature list with fitness copy (Aria, schede allenamento, `.spr`, Anonimizza).
- Fitness-specific value proof-points and draft types (piano allenamento, nota nutrizionale).
- `README.md` / `CURRENT-TASK.md` content.
