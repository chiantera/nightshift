# Nightshift — Full Frontend Redesign Design

**Date:** 2026-06-06
**Branch:** `nightshift` (worktree `/home/deckard/projects/schedapro-nightshift`)
**Status:** design approved in brainstorming, ready for implementation plan

---

## Goal

Give SchedaPRO its own visual identity — **athletic editorial**, distinct from its legal twin PLT. Today the frontend wears PLT's "Carta & Inchiostro" (warm-paper + bordeaux + Newsreader serif) skin and carries legal vocabulary (`--giulia-ink`, "contraddizioni", "atti/priorità difensive"). The product is a coach tool for personal trainers; it should look and read like one.

The redesign is **visual + light copy**, not a functional rewrite. All existing behaviour (IndexedDB persistence, background analysis jobs, source-linking, app-lock, auth, .spr export, Aria personalization) stays intact. We re-skin every screen and rename the borrowed legal identity.

## Thesis of the look

> Il caos della scheda cliente diventa un cruscotto di progressi. I numeri del cliente sono i protagonisti.

Two themes, one DNA:
- **Nightshift** (dark, default) — charcoal + acid lime, numbers that glow.
- **Daylight** (light) — warm off-white, near-black numbers, lime as fill only.

Core moves:
1. **Numbers-as-hero.** Each client's key metric (chosen by goal: strength %, weight Δ, mass %, adherence) is rendered large in the display face, treated like a scoreboard stat-line. The home becomes a glance-able dashboard (who progresses / who is stalled / who has signals), not a grey list.
2. **Aria owns a colour.** Cyan/teal is Aria's, everywhere (prompt bar, evidence strip, recommendations, source chips). It is no longer the borrowed navy of GiulIA.
3. **Lime = action.** The one energetic accent for primary actions and active states.
4. **Show-the-work stays.** Source chips (mono) under timeline items remain — the differentiator.
5. **Fitness vocabulary.** No courtroom terms in UI or class names.

---

## Design tokens

Replace the contents of `frontend/src/tokens.css`. Same architecture (CSS custom properties, `:root` = dark default, `[data-theme="light"]` = light). Drop the Newsreader/Satoshi imports; load Anton + Hanken Grotesk + JetBrains Mono.

### Fonts

```
--font-display: 'Anton', 'Arial Narrow', sans-serif;   /* big numbers + home headline ONLY */
--font-ui:      'Hanken Grotesk', system-ui, sans-serif; /* everything else */
--font-mono:    'JetBrains Mono', ui-monospace, monospace; /* source chips, technical */
```

Anton is used **only** for: large hero numbers, stat-card values, stat-strip values, and the home headline (which is uppercase by nature). Everything else — client names, body, labels, buttons — is Hanken Grotesk. (Validated in brainstorming: Anton restricted to numbers reads as athletic, not brutal.)

### Nightshift (dark — `:root`, default)

```
--paper:        #0E0F12;   /* app background */
--paper-raised: #16181D;   /* cards, surfaces */
--paper-sunken: #1C1F26;   /* insets, ghost buttons */

--ink-1: #F4F5F7;          /* primary text, big numbers (when not accented) */
--ink-2: #C7CCD4;          /* secondary text */
--ink-3: #8A8F99;          /* muted / labels */
--ink-4: #5F6670;          /* faint */

--rule:        #262A32;
--rule-strong: #343A44;

/* Lime — the one action accent */
--accent:       #C8FF4D;
--accent-deep:  #B6F03A;   /* hover */
--accent-soft:  rgba(200,255,77,0.10);
--on-accent:    #0E0F12;   /* text on a lime fill */

/* Aria — cyan */
--aria:         #2DE2C0;   /* Aria pip/icon, glow */
--aria-ink:     #A7E8DE;   /* Aria text on dark */
--aria-bg:      #0F1A19;
--aria-border:  #1F3B3A;

/* Semantic */
--critical: #FF6B5A; --critical-soft: #2A1210;
--warning:  #E0A22D; --warning-soft:  #241D0E;
--success:  #3FCB7A; --success-soft:  #102015;
```

### Daylight (light — `[data-theme="light"]`)

```
--paper:        #F5F5EF;
--paper-raised: #FFFFFF;
--paper-sunken: #ECECE4;

--ink-1: #14161A;
--ink-2: #3A3E45;
--ink-3: #717783;
--ink-4: #9AA0AA;

--rule:        #E4E4DC;
--rule-strong: #D2D2C8;

/* Lime — FILL ONLY on light (lime text on white is illegible) */
--accent:       #C8FF4D;   /* button/bar fill */
--accent-deep:  #A6D400;   /* progress-bar fill, hover */
--accent-line:  #5C7A00;   /* deep lime for the few times lime must be text (e.g. the "%" accent) */
--accent-soft:  #F2F8DC;
--on-accent:    #14161A;   /* text on a lime fill */

/* Aria — teal (darkened for legibility on white) */
--aria:         #0B7D6E;
--aria-ink:     #0B7D6E;
--aria-pip:     #0E9C88;
--aria-bg:      #E2F6F1;
--aria-border:  #B6E3DA;

/* Semantic */
--critical: #B5301E; --critical-soft: #FBEDEA;
--warning:  #9A6B00; --warning-soft:  #FBF4E6;
--success:  #2E6B3F; --success-soft:  #E8F3EC;
```

**Hero numbers:** dark theme → lime (`--accent`); light theme → near-black (`--ink-1`) with the unit/`%` in `--accent-line`. This split is the one place the two themes diverge in rule, not just value — handle it with a theme-aware class, not a single var.

### Radii / spacing / motion

Keep the existing scale (`--space-*`, `--radius-1..4`, `--dur-*`, `--ease`). Athletic editorial leans on slightly larger radii for cards (16–18px) — bump `.case-card`/hero surfaces to 16–18px but keep the token scale intact.

### Shadows

Dark theme: shadows are near-useless on near-black; use **border + subtle inner glow** for elevation (e.g. lime/cyan radial glow behind hero numbers, already mocked). Light theme: keep soft shadows (reuse `--shadow-1..3` recalculated for light ink).

---

## Theme switching

- **Default = dark** (Nightshift).
- First launch: respect `prefers-color-scheme` — if the device prefers light, start in Daylight; otherwise dark.
- Toggle lives in the **Profile drawer** (persisted per-user via `userKey('theme')`, values `dark`/`light`/`auto`).
- Mechanism: set `data-theme` on `<html>`. `:root` holds dark; `[data-theme="light"]` overrides. (Note: current `tokens.css` uses `[data-theme="night"]` for an old dark variant — we invert: dark is the default `:root`, light is the override.)
- Respect the user's existing app-lock / no FOUC: set the attribute before first paint (inline script in `index.html` reading the stored value).

---

## Vocabulary & identity rename map

Code-level (mechanical, repo-wide on the `nightshift` branch):

| From | To | Where |
|---|---|---|
| `--giulia-ink` / `--giulia-soft` | `--aria` / `--aria-bg` (+ new aria tokens) | tokens.css + all usages |
| `.giulia-ctx-btn` | `.aria-ctx-btn` | styles.css + JSX |
| `.giulia-prompt-bar` (alias) | `.aria-prompt-bar` (drop the giulia alias) | styles.css + JSX |
| `.legal-panel`, `.legal-section` | `.analysis-panel`, `.analysis-section` | styles.css + CaseDetailView |
| `.drop-zone--giur`, "giurisprudenza" leftovers | documento/`--doc` | upload drawer |

Copy-level (UI strings):

| From | To |
|---|---|
| "contraddizioni" (stat + tab) | "segnali" |
| draft-prompt legal text ("priorità difensive", "documenti da portare o acquisire", "atti da predisporre", "fonti da controllare") in `requestDraft` for the next-appointment | fitness equivalents ("priorità della sessione", "cosa portare/preparare", "esercizi da impostare", "dati da verificare") |
| any "fascicolo" leftover in copy | "scheda" |

Tabs already fitness (Storico sessioni, Appuntamenti, Profilo & misurazioni, Analisi AI, Piano allenamento, Note trainer) — keep.

## Italian copy conventions

- **Days = "gg"** (not "g"). "g" = grammi. Kg = "kg". Apply to all day-relative strings: "3 gg/sett.", "ultima 2 gg fa", "fermo da 9 gg".

---

## Per-screen treatment

Mobile-first throughout; shell stays `min(100%, 720px)`. Each screen gets the new tokens + the patterns below.

### Home / client list
- Brand row (lime logo tile + studio tagline) + account controls.
- **Headline** `I MIEI / CLIENTI` in Anton uppercase, lime accent on "CLIENTI".
- **Stat-strip** (scoreboard): clienti, sessioni/sett., segnali, oggi — Anton numbers, divided cells.
- Aria prompt bar (cyan).
- Action row: search + Nuovo (lime fill) + Importa (ghost).
- **Client cards reimagined:** each card carries the client's hero metric (lime in dark / near-black in light) on the right; risk dot beside the name; goal subline; meta (sessions, "ultima N gg fa"). Stalled client → metric shows "—" + "fermo da N gg" with a critical dot. "analisi in corso…" pill in cyan.

### Case detail
As fully mocked: hero (eyebrow + client name + meta + big hero number + actions Aggiungi/Analizza/Sessione), Aria evidence strip (cyan), 4 stat cards (materiali/eventi/segnali/priorità), tab bar (lime active underline), analysis panel (risk row + cyan-dot timeline with mono source chips + Aria recommendation card with cyan CTA), bottom Aria prompt bar. The "prompt+stats+tabs unified card" we just shipped on main is superseded by this layout — rebuild natively in Nightshift.

### Login / AuthScreen
- Two-column (warning+form left, hero right) layout retained, re-skinned dark. Disclaimer card + mandatory checkbox kept (gates submit). Hero proof-points rewritten in athletic voice. Inline non-blocking AuthHelp kept.

### First-run / Aria setup wizard (FirstRunWizard)
- Re-skin the panel (PanelModal) to Nightshift: dark surface, lime "Salva", cyan accents, Anton not needed here. Keep the dark-theme fix we already made (the wizard was already forcing dark) — now it matches the app theme natively instead of overriding. `editMode` from Profile retained. Chips use accent-on style.

### Upload drawer (MultiFileUploadDrawer)
- Re-skin: drop zone, tabs (scheda/documento), queue items (uploading=lime, done=success, error=critical), URL import section (cyan = Aria-adjacent), the "Personalizzazione pronta" preview + focus chips. Mic button states.

### Chat with Aria (ChatPanel / drawer + FAB)
- Cyan-forward. FAB in cyan. Message bubbles: user = paper-sunken, Aria = aria-bg with cyan edge. Prompt bar matches.

### App-lock (LockGate / LockScreen / LockSetup)
- Dark PIN keypad, lime active digit, cyan biometric affordance. Logout escape hatch kept.

### Profile drawer (AccountControls / ProfileDrawer)
- Re-skin. **Add the theme toggle** (dark/light/auto). Keep: "Modifica configurazione Aria", LockManager, "Cosa fa Aria", global suggestions toggle, logout.

### Empty / loading / banners
- Loading shell, empty-state placeholders, warming/analyzing/error banners — re-skin to dark-first with lime/cyan/semantic accents.

---

## Constraints & non-goals

- **No functional changes.** Persistence, jobs, auth, lock, export, personalization, source-linking all behave identically. This is skin + copy + vocabulary.
- **Keep both themes on tokens** — no hardcoded colors in components; everything via vars so the theme is a variable set.
- **Mobile-first**, verify in browser before "done".
- **Out of scope:** information-architecture rework (Direction C — the glance-able "today" view) is a *future* phase; this redesign keeps the current tab structure. Backend untouched. PLT is not modified (port notes are a separate later task).

---

## Execution

- All work on branch `nightshift` in worktree `/home/deckard/projects/schedapro-nightshift`. `main` stays deployable.
- **Subagent-driven development**: token foundation first (one task), then per-screen tasks, each with spec-compliance + code-quality review. Verify `npm run build` (zero TS errors) + existing `check-*.mjs` smoke tests after each.
- Update `check-value-messaging.mjs` / `check-auth-onboarding.mjs` expectations where class names / copy changed.
- When all screens are done and verified in-browser (both themes), open a PR `nightshift → main`; deploy a Netlify branch-preview for live QA before merge.
- Docs (`README.md`, `CURRENT-TASK.md`, `docs/port-login-to-plt.md`) updated as part of "done"; `CLAUDE.md`/`AGENTS.md` re-synced if touched.
