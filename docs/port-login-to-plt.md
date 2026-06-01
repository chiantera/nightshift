# Port back to PLT — login page, account controls, AI-instructions modal

Changes made to SchedaPRO (2026-06-01 session) that we want to port **back to PLT**
(`/home/deckard/projects/plt/alpha-pwa/`). SchedaPRO was forked from PLT, so the
`AuthScreen` / `useAuth` / analyze / draft structure is shared — these should drop
in with only brand/copy changes (Digital Trainer → PLT, Aria → GiulIA, fitness → legale).

Reference commits in `chiantera/schedapro` (chronological):
- `c6167e97d` — full login page (disclaimer+checkbox, AuthTour, layout swap, hero, logout fix)
- `ffeeb99af` — top-align login columns
- `b2002e146` — AccountControls (Profilo + quick Logout) everywhere + AriaPromptBar/upload UX
- `ceaf6d436` — pre-flight "istruzioni per Aria" modal before analyze/draft (+ backend `user_instructions`)

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

## 2. AuthTour — first-run welcome panel on the login page ✅

A modal welcome panel shown on first visit, reusing the onboarding wizard's
`.tour-*` look. Guides: read the warning → tick the box → sign in/up.

- **Component:** `AuthTour` (just above `AuthScreen`), rendered as the first child
  of `.auth-screen` (`<AuthTour />`).
- **Persistence:** `const AUTH_TOUR_KEY = 'schedapro:auth-tour:dismissed';`
  — ✕ / "Ho capito" close for the session; "Non mostrare più" writes the key.
  Uses a **separate key from the in-app tour** so dismissing one doesn't kill the other.
- **CSS:** `.auth-tour-backdrop` (dim + center), `.auth-tour-panel`
  (`position: static` override of `.tour-tooltip`), `.auth-tour-steps`,
  `.auth-tour-ok`. Reuses `.tour-tooltip`, `.tour-close`, `.tour-title`,
  `.tour-body`, `.tour-dontshow` from `onboarding/onboarding.css` (already in PLT).

**Port note:** change `AUTH_TOUR_KEY` → `plt:auth-tour:dismissed`, rebrand the
title ("Benvenuto in PLT 👋") and the 3 steps. The `.tour-*` base classes already
exist in PLT, so only the `.auth-tour-*` rules need copying into PLT's `styles.css`.

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

## 4. Logout fix in dev-bypass mode ✅ (likely a latent PLT bug too)

In `VITE_BYPASS_AUTH` mode `useAuth` fabricated a session but never listened for
`SIGNED_OUT`, so `supabase.auth.signOut()` ("Esci dall'account") did nothing on
localhost. Fix: in the bypass branch, subscribe and clear the faked session.

```ts
if (DEV_BYPASS_AUTH) {
  setSession({ /* faked session */ } as Session);
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') setSession(null);
  });
  return () => subscription.unsubscribe();
}
```

**Port note:** PLT inherits the same bypass pattern — verify `useAuth` there and
apply the same listener. Production (real Supabase) was never affected.

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

---

## NOT to port (SchedaPRO-specific)

- Hero 6-feature list with fitness copy (Aria, schede allenamento, `.spr`, Anonimizza).
- `README.md` / `CURRENT-TASK.md` content.
