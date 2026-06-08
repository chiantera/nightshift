# Settings Page Design (Nightshift)

**Date:** 2026-06-08
**Branch:** `nightshift` (worktree `/home/deckard/projects/schedapro-nightshift`)
**Status:** design proposed, awaiting user review of this spec

---

## Goal

Give SchedaPRO a single, dedicated **Settings page** that consolidates every user-facing setting — the ones scattered in the Profile drawer today plus new ones a fitness coach product needs (units, data management, AI defaults, about). Styled in the Nightshift design system, mobile-first, both themes.

## Scope decision

This is ONE cohesive feature (a settings screen consolidating prefs), not multiple subsystems → one spec. Heavy items needing real backend/permissions are explicitly deferred to a phase 2.

## Structure & architecture

- **New screen `SettingsScreen`** (full-page, peer of `CaseDetailView`), reached from the Profile drawer. Sticky top bar: back button + "Impostazioni" title. Body = vertically scrolled, grouped **section cards** (`.panel`), mobile-first.
- **Profile drawer slims to a quick menu:** user identity (name/email) · **"Apri Impostazioni"** (opens `SettingsScreen`) · **Logout**. Everything else currently in the drawer (theme, Aria config, PIN, suggestions, profile fields) MOVES into the settings page. The drawer no longer holds settings — it's just identity + entry point + logout.
- **Navigation:** add a `view`/route state for settings (the app already routes between home and case detail via a `view`-style switch in `main.tsx`; add a `settings` view). Back returns to where the user came from (home or a case).
- **Persistence model — apply immediately, no global Save** for prefs (toggles/selects write through on change). The Supabase **profile fields keep their own Save** (they're a network write). Existing subsystems keep their own stores; the settings page is a thin UI over them plus a small new prefs store.

### New module `frontend/src/settings/`
- `settingsStore.ts` — typed get/set for the NEW preferences, persisted per-user via `userKey`:
  ```ts
  interface AppPrefs {
    weightUnit: 'kg' | 'lb';
    lengthUnit: 'cm' | 'in';
    dateFormat: 'dmy' | 'mdy' | 'iso';   // gg/mm/aaaa · mm/gg/aaaa · aaaa-mm-gg
    weekStart: 'mon' | 'sun';
    anonymizeByDefault: boolean;
  }
  ```
  Exports `getPrefs()`, `setPref<K>(key, value)`, sensible defaults (`kg`/`cm`/`dmy`/`mon`/`false`), stored at `userKey('app-prefs:v1')`. Pub/sub or simple read-on-mount + event, consistent with existing patterns.
- `SettingsScreen.tsx` — the page shell + section composition.
- One component per section (small, focused files) under `settings/sections/`.

## Sections (final content)

Each row = label + control, Nightshift styled. Marked `[esiste]` (move/reuse existing logic), `[nuovo]`, `[fase 2]`.

**1. Account**
- Email — read-only, from `session.user.email`.
- **Cambia password** — button → `supabase.auth.resetPasswordForEmail(email)` (sends a reset email; no password is ever typed in-app). Confirmation toast: "Ti abbiamo inviato un'email per reimpostare la password."
- Logout `[esiste]` — with confirm.
- *Elimina account* `[fase 2]` — disabled row labeled "presto" (needs backend deletion + data purge).

**2. Profilo / Studio** `[esiste]`
- Nome, Studio/Palestra, Telefono (the current `profiles` fields). Own "Salva" button (Supabase write), preserving existing behavior.
- *Avatar/logo* `[fase 2]` — omitted for now (needs storage).

**3. Aspetto** `[esiste]`
- Tema: Scuro / Chiaro / Auto segmented control (reuses `theme.ts` `getThemeChoice`/`setThemeChoice`).

**4. Aria (AI)**
- "Modifica configurazione Aria" `[esiste]` — opens `FirstRunWizard` in `editMode` (specialità, formato, tono), same as today.
- Default analisi: **Flash / Pro** segmented `[nuovo pref]` (stored in app-prefs; consumed where analyze defaults are chosen). Default Flash (matches the product bias).
- "Chiedi sempre conferma prima di Pro" toggle `[nuovo pref, default ON]` — the pre-flight `AiInstructionsModal` already gates Pro; this pref records the explicit preference and keeps the confirm mandatory when ON. (When the default is Flash this is informational; keep ON.)

**5. Unità & formato** `[nuovo]`
- Peso: **kg / lb** segmented.
- Lunghezza: cm / in segmented.
- Formato data: gg/mm/aaaa · mm/gg/aaaa · aaaa-mm-gg.
- Inizio settimana: Lun / Dom.
- Wiring: add `frontend/src/settings/format.ts` with `formatWeight(kg: number)` and `formatLength(cm: number)` that read `getPrefs()` and convert+suffix; extend `dateUtils.ts` formatters to honor `dateFormat`. Route existing weight/measurement displays (primarily in `CaseDetailView.tsx`, the "Profilo & misurazioni" area) through `formatWeight`/`formatLength`. (Stored values stay canonical — kg/cm — only display converts.) This is the largest implementation surface.

**6. Privacy & sicurezza**
- Blocco con PIN + biometria `[esiste]` — the `LockManager` UI moves here (set/change/remove PIN, toggle biometric).
- **Timeout inattività** `[esiste — expose]` — select (1 / 5 / 15 min / Mai). `appLock` already stores `idleTimeoutMin` and has a setter; this exposes it. "Mai" = a sentinel (e.g. 0/disabled auto-lock-on-idle while keeping lock-on-cold-start).
- Anonimizzazione di default `[nuovo pref]` toggle + "Gestisci regole di anonimizzazione" (the existing `spr:redaction-rules`).
- Auto-logout 72h `[esiste]` — read-only explainer row ("Per sicurezza l'accesso scade ogni 72 ore"), not configurable.

**7. Dati**
- **Esporta tutte le schede** `[nuovo, composes existing]` — exports every local case as `.spr` (sequential downloads, or a single bundle; sequential is simplest and reuses `sprExport`).
- **Importa** `.spr` `[esiste]` — same picker/flow as the home "Importa".
- Svuota chat `[esiste]` — clears `spr:chat-messages` + in-memory.
- **Reset suggerimenti / onboarding** `[esiste]` — clears `seen`/`optout`/`onboarding:dismissed` so hints + tour reappear; a "Rivedi il tour" action re-triggers onboarding.
- **Cancella dati locali del dispositivo** `[nuovo, destructive]` — strong confirm; wipes this user's IndexedDB cases + `spr:` keys (NOT the Supabase account). Clear copy: "I dati sono solo su questo dispositivo; questa azione è irreversibile."

**8. Suggerimenti / Aiuto**
- Interruttore suggerimenti `[esiste]` (`areSuggestionsEnabled`/`setSuggestionsEnabled`).
- "Rivedi il tour" `[esiste]` (re-trigger onboarding).
- "Cosa fa Aria" `[esiste]` — expands `AriaCapabilities`.

**9. Info**
- Versione app `[nuovo]` — from `package.json` version injected at build (Vite `define` or `import.meta.env`).
- Link Privacy / Termini `[nuovo]` — to existing pages/URLs if present, else placeholders.
- Crediti / "Digital Trainer" one-liner.

## Phase 2 (explicitly deferred — need real backend/permissions)

- Push/local notifications for appointment reminders.
- Account deletion (server-side purge).
- Avatar/logo upload (storage).

These appear as disabled "presto" rows where it aids discoverability, or are omitted. No stubbed fake behavior.

## Style

Nightshift tokens only. `.settings-section` (a `.panel` card with an uppercase section label + optional icon), `.settings-row` (flex: label/description left, control right), consistent segmented controls (reuse `.theme-toggle` pattern), toggles, selects. Destructive actions use `--critical`. Mobile-first; sections stack; comfortable tap targets.

## Constraints & non-goals

- **No backend/model changes** beyond the safe `resetPasswordForEmail` call. Units convert at display time; stored data stays canonical.
- **Password is never entered in-app** (reset-email flow only) — policy.
- Reuse existing subsystems (theme, appLock, seen, sprExport, redaction, Supabase profile); the page is a consolidating UI + one small prefs store.
- Phase-2 items are not stubbed with fake behavior.

## Execution

- Built on branch `nightshift` (depends on the new design system + `theme.ts`; nightshift is not yet merged to main).
- Subagent-driven, task-by-task: prefs store → screen shell + drawer slim → section-by-section → units wiring (the big one) → data actions → verify (build + smoke + both themes in browser).
- Update docs (README features/tree, CURRENT-TASK) as part of done.
