# Nightshift Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the entire SchedaPRO frontend to the "Nightshift" athletic-editorial identity (dark default + light "Daylight" theme), replacing the inherited PLT "Carta & Inchiostro" look and legal vocabulary — visual + copy only, zero functional change.

**Architecture:** A token-first re-skin. Task 1 rewrites `tokens.css` with both themes AND keeps backward-compat aliases for every old token name (`--sigillo`→`--accent`, `--giulia-ink`→`--aria`, etc.) so the whole app instantly adopts the new palette with no broken intermediate state. Subsequent tasks refine one screen at a time (native class/copy updates). The final task drops the aliases and cleans up. Theme is a pure CSS-variable set toggled via `data-theme` on `<html>`; a no-FOUC inline script in `index.html` applies the persisted choice before first paint.

**Tech Stack:** React 19 + Vite 6 + TypeScript, plain CSS custom properties (no CSS framework), Google Fonts (Anton, Hanken Grotesk, JetBrains Mono). Verification via `npm run build` (tsc), the existing `frontend/scripts/check-*.mjs` smoke tests, and in-browser checks.

**Spec:** `docs/superpowers/specs/2026-06-06-nightshift-redesign-design.md`

**Verification note (read once):** This is frontend re-skin work — there are no unit tests to write per change. "Verify" means, per task: (1) `cd frontend && npm run build` exits 0 with zero TypeScript errors; (2) the relevant `npm run test:*` smoke script passes; (3) the screen renders correctly in the browser in BOTH themes. The dev server for this worktree runs on port **5175** (the `main` checkout uses 5174): `cd /home/deckard/projects/schedapro-nightshift/frontend && VITE_BYPASS_AUTH=true npm run dev -- --port 5175`.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `frontend/src/tokens.css` | Both theme palettes + fonts + back-compat aliases | 1 |
| `frontend/index.html` | No-FOUC pre-paint theme script + font preconnect | 1 |
| `frontend/src/theme/theme.ts` | **New** — theme get/set/resolve, `prefers-color-scheme`, `userKey('theme')` persistence, `applyTheme()` | 1 |
| `frontend/src/styles.css` | Global primitives + all per-screen class blocks | 2,3,4,5,6,8,9,10 |
| `frontend/src/main.tsx` | Home (HomeView) + Auth (AuthScreen) + shell | 3,6 |
| `frontend/src/screens/CaseDetailView.tsx` | Case detail markup + vocab + draft copy + hero metric | 4 |
| `frontend/src/components/AriaPromptBar.tsx`, `ChatPanel.tsx` | Aria cyan surfaces | 5 |
| `frontend/src/value/FirstRunWizard.tsx`, `PanelModal.tsx`, `value.css`, `personalization.ts` | Wizard re-skin + hero-metric helper | 4,7 |
| `frontend/src/components/MultiFileUploadDrawer.tsx` | Upload drawer re-skin | 8 |
| `frontend/src/lock/LockScreen.tsx`, `LockSetup.tsx`, `lock.css` | PIN/lock re-skin | 9 |
| `frontend/src/analysis/AnalysisProgressBanner.tsx`, `analysis-progress.css` | Banner re-skin | 2 |
| `frontend/src/onboarding/OnboardingWizard.tsx`, `onboarding.css` | Tour re-skin | 10 |
| `frontend/src/components/AccountControls.tsx` | Profile drawer + **theme toggle** | 11 |
| `frontend/scripts/check-value-messaging.mjs`, `check-auth-onboarding.mjs` | Updated expectations | 12 |
| `README.md`, `CURRENT-TASK.md`, `docs/port-login-to-plt.md` | Docs | 12 |

---

## Task 0: Worktree setup

**Files:** none (environment only)

- [ ] **Step 1: Install deps in the worktree**

The worktree has no `node_modules` yet.

Run: `cd /home/deckard/projects/schedapro-nightshift/frontend && npm install`
Expected: completes, `node_modules/` present.

- [ ] **Step 2: Confirm baseline build is green before any change**

Run: `cd /home/deckard/projects/schedapro-nightshift/frontend && npm run build`
Expected: exits 0, zero TypeScript errors (this is the unchanged `main` code).

---

## Task 1: Token foundation, fonts, theme module, no-FOUC

**Files:**
- Modify: `frontend/src/tokens.css` (full rewrite)
- Modify: `frontend/index.html` (add pre-paint script)
- Create: `frontend/src/theme/theme.ts`
- Modify: `frontend/src/main.tsx` (call `applyTheme` on boot — 1 line near the existing imports/bootstrap)

- [ ] **Step 1: Rewrite `frontend/src/tokens.css`**

Replace the ENTIRE file with the following. Dark is the default (`:root`); light is `[data-theme="light"]`. Aliases at the bottom keep every existing component working until its screen task lands.

```css
/* SchedaPRO — Nightshift design system tokens. Load BEFORE styles.css.
   Dark ("Nightshift") is the default :root. Light ("Daylight") = [data-theme="light"]. */

@import url('https://fonts.googleapis.com/css2?family=Anton&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  /* ── Surfaces (Nightshift / dark) ── */
  --paper:        #0E0F12;
  --paper-raised: #16181D;
  --paper-sunken: #1C1F26;

  /* ── Ink ── */
  --ink-1: #F4F5F7;
  --ink-2: #C7CCD4;
  --ink-3: #8A8F99;
  --ink-4: #5F6670;
  --ink-5: #3A3F47;

  /* ── Rules ── */
  --rule:        #262A32;
  --rule-strong: #343A44;

  /* ── Lime — the one action accent ── */
  --accent:      #C8FF4D;
  --accent-deep: #B6F03A;
  --accent-soft: rgba(200,255,77,0.10);
  --accent-line: #C8FF4D;   /* lime is legible as text on dark */
  --on-accent:   #0E0F12;

  /* ── Aria — cyan ── */
  --aria:        #2DE2C0;
  --aria-ink:    #A7E8DE;
  --aria-pip:    #2DE2C0;
  --aria-bg:     #0F1A19;
  --aria-border: #1F3B3A;

  /* ── Semantic ── */
  --critical: #FF6B5A; --critical-soft: #2A1210;
  --warning:  #E0A22D; --warning-soft:  #241D0E;
  --success:  #3FCB7A; --success-soft:  #102015;
  --info:     #2DE2C0; --info-soft:     #0F1A19;

  /* ── Typography ── */
  --font-display: 'Anton', 'Arial Narrow', sans-serif;          /* big numbers + home headline ONLY */
  --font-ui:      'Hanken Grotesk', system-ui, -apple-system, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;

  /* ── Spacing (8-pt) ── */
  --space-05: 4px; --space-1: 8px; --space-2: 12px; --space-3: 16px;
  --space-4: 24px; --space-5: 32px; --space-6: 48px; --space-7: 64px;

  /* ── Radii ── */
  --radius-1: 4px; --radius-2: 10px; --radius-3: 14px; --radius-4: 18px;

  /* ── Shadows (dark: rely on borders + glow; keep vars soft) ── */
  --shadow-1: 0 1px 0 rgba(0,0,0,0.3);
  --shadow-2: 0 8px 24px -10px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4);
  --shadow-3: 0 22px 56px -16px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.45);

  /* ── Motion ── */
  --dur-1: 120ms; --dur-2: 200ms; --ease: cubic-bezier(0.2, 0.6, 0.2, 1);

  /* ── Back-compat aliases (REMOVED in Task 12 once all usages renamed) ── */
  --sigillo: var(--accent); --sigillo-deep: var(--accent-deep); --sigillo-soft: var(--accent-soft);
  --giulia-ink: var(--aria); --giulia-soft: var(--aria-bg);
}

[data-theme="light"] {
  --paper:        #F5F5EF;
  --paper-raised: #FFFFFF;
  --paper-sunken: #ECECE4;

  --ink-1: #14161A;
  --ink-2: #3A3E45;
  --ink-3: #717783;
  --ink-4: #9AA0AA;
  --ink-5: #C4C8CE;

  --rule:        #E4E4DC;
  --rule-strong: #D2D2C8;

  --accent:      #C8FF4D;     /* fill only */
  --accent-deep: #A6D400;     /* bar fill / hover */
  --accent-soft: #F2F8DC;
  --accent-line: #5C7A00;     /* deep lime for the rare lime-as-text case */
  --on-accent:   #14161A;

  --aria:        #0B7D6E;
  --aria-ink:    #0B7D6E;
  --aria-pip:    #0E9C88;
  --aria-bg:     #E2F6F1;
  --aria-border: #B6E3DA;

  --critical: #B5301E; --critical-soft: #FBEDEA;
  --warning:  #9A6B00; --warning-soft:  #FBF4E6;
  --success:  #2E6B3F; --success-soft:  #E8F3EC;
  --info:     #0B7D6E; --info-soft:     #E2F6F1;

  --shadow-1: 0 1px 0 rgba(26,24,20,0.04);
  --shadow-2: 0 6px 20px -8px rgba(26,24,20,0.18), 0 1px 2px rgba(26,24,20,0.06);
  --shadow-3: 0 18px 48px -16px rgba(26,24,20,0.28), 0 2px 4px rgba(26,24,20,0.08);
}
```

- [ ] **Step 2: Create `frontend/src/theme/theme.ts`**

```ts
import { userKey } from '../storage/userStorage';

export type ThemeChoice = 'dark' | 'light' | 'auto';
export type ResolvedTheme = 'dark' | 'light';

const KEY = 'theme';

/** Stored choice (per-user). Defaults to 'auto'. */
export function getThemeChoice(): ThemeChoice {
  const v = localStorage.getItem(userKey(KEY));
  return v === 'dark' || v === 'light' || v === 'auto' ? v : 'auto';
}

export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  if (choice === 'dark' || choice === 'light') return choice;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Sets data-theme on <html>. Dark is the default (no attribute needed, but we set it explicitly). */
export function applyTheme(choice: ThemeChoice = getThemeChoice()): void {
  const resolved = resolveTheme(choice);
  document.documentElement.setAttribute('data-theme', resolved);
}

export function setThemeChoice(choice: ThemeChoice): void {
  localStorage.setItem(userKey(KEY), choice);
  applyTheme(choice);
}
```

- [ ] **Step 3: Add the no-FOUC pre-paint script to `frontend/index.html`**

In `<head>`, BEFORE the stylesheet/module imports, add (it can't import the TS module — inline minimal logic; `userStorage` defaults the user to `anon`, and the no-FOUC script reads the anon key, which is correct before auth resolves):

```html
<script>
  (function () {
    try {
      var k = Object.keys(localStorage).find(function (x) { return /:theme$/.test(x); });
      var c = k ? localStorage.getItem(k) : 'auto';
      var dark = c === 'dark' || (c !== 'light' && !(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches));
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    } catch (e) { document.documentElement.setAttribute('data-theme', 'dark'); }
  })();
</script>
```

- [ ] **Step 4: Call `applyTheme()` on boot in `frontend/src/main.tsx`**

Add the import near the other imports and call once before `createRoot(...).render(...)`:

```tsx
import { applyTheme } from './theme/theme';
// ...
applyTheme();
createRoot(document.getElementById('root')!).render(<App />);
```

- [ ] **Step 5: Verify build + both themes render**

Run: `cd frontend && npm run build`
Expected: exits 0, zero TS errors.

Run the dev server and open `http://localhost:5175`. Expected: app is now dark (Nightshift palette) via aliases — components are recolored but not yet re-laid-out; nothing is broken/unstyled. In devtools set `document.documentElement.setAttribute('data-theme','light')` → flips to Daylight palette.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/tokens.css frontend/index.html frontend/src/theme/theme.ts frontend/src/main.tsx
git commit -m "feat(nightshift): token foundation, fonts, theme module, no-FOUC"
```

---

## Task 2: Global primitives + banners

**Files:**
- Modify: `frontend/src/styles.css` (base, typography, buttons, risk-pill, banners, empty/loading)
- Modify: `frontend/src/analysis/analysis-progress.css`

- [ ] **Step 1: Re-skin base typography + buttons in `styles.css`**

Update these blocks (lines are approximate — match by selector):

- `h1` (line ~39): change `font-family: var(--font-display)` to `var(--font-ui)` with `font-weight: 800` (Anton is for numbers/home-headline only; generic h1 should be Hanken bold). Keep clamp sizing.
- `.primary-button` (~109): `background: var(--accent); color: var(--on-accent); font-weight: 800;` hover `background: var(--accent-deep)`.
- `.secondary-button` (~116): make it the cyan/Aria-neutral ghost: `background: var(--paper-sunken); color: var(--ink-1); border: 1px solid var(--rule-strong);` hover `border-color: var(--accent); color: var(--ink-1);`.
- `.ghost-button` (~123): keep transparent; `color: var(--ink-2); border: 1px solid var(--rule);` hover `background: var(--paper-sunken)`.
- Button base radius already `var(--radius-2)`.

- [ ] **Step 2: Re-skin banners + empty/loading**

- `.warming-banner`, `.analyzing-banner`, `.error-banner`: set backgrounds to `var(--paper-raised)`, borders `1px solid var(--rule)`; analyzing uses `--aria` accent (spinner color `var(--aria)`), error uses `--critical`/`--critical-soft`. (Find each `.<name>-banner` block in styles.css.)
- `.empty-state-placeholder` (~746): `background: var(--paper-sunken); border: 1px dashed var(--rule-strong);` text `var(--ink-3)`.
- `.loading-shell` color `var(--ink-3)`.

- [ ] **Step 3: Re-skin `analysis-progress.css`**

Replace hardcoded colors / old accents with tokens: progress bar fill `var(--aria)`, track `var(--paper-sunken)`, text `var(--ink-2)`, abort button `var(--critical)`. (No hardcoded hex left in the file.)

- [ ] **Step 4: Verify**

Run: `cd frontend && npm run build` → 0 errors.
Browser: trigger an analysis (or inspect) — banner + buttons look native dark; flip `data-theme=light` and confirm contrast.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/styles.css frontend/src/analysis/analysis-progress.css
git commit -m "feat(nightshift): global primitives (typography, buttons, banners, empty states)"
```

---

## Task 3: Home / client list

**Files:**
- Modify: `frontend/src/main.tsx` (HomeView render: brand row, headline, stat-strip, action bar, client cards)
- Modify: `frontend/src/styles.css` (`.home-*`, `.case-card*`, `.stats-grid` shared)
- Modify: `frontend/src/value/personalization.ts` (add hero-metric helper — see Step 1)

- [ ] **Step 1: Add a hero-metric helper in `personalization.ts`**

The home + case hero show a per-client "hero number". Add a pure helper that derives a display metric from a `CaseAnalysisSummary` (use whatever progress fields exist; fall back gracefully). Keep it dumb and defensive.

```ts
// in personalization.ts
import type { CaseAnalysisSummary } from '../domain/types'; // adjust to actual summary type

export interface HeroMetric { value: string; unit?: string; label: string; stalled?: boolean; }

/** Best-effort headline metric for a client card/hero. Returns a stalled marker
 *  when the client has had no recent session, so the UI can flag attention. */
export function heroMetric(c: CaseAnalysisSummary): HeroMetric {
  // Stalled: no session in 7+ days (uses last_activity if present).
  const days = daysSince(c.last_activity);
  if (days != null && days >= 7) return { value: '—', label: `fermo da ${days} gg`, stalled: true };
  // Otherwise show goal-progress if available, else session count.
  if (c.progress_headline) return { value: c.progress_headline, label: c.progress_caption ?? '', };
  return { value: String(c.session_count ?? 0), label: 'sessioni' };
}

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return Number.isFinite(d) ? d : null;
}
```

NOTE for implementer: inspect `frontend/src/domain/types.ts` for the actual summary shape. If `progress_headline`/`last_activity`/`session_count` don't exist, use the nearest real fields (e.g. count `materials`/`timeline`, derive recency from the newest timeline date). Keep the `HeroMetric` shape. Do not invent persisted data — derive from what the summary already has.

- [ ] **Step 2: Rewrite the HomeView hero + cards markup in `main.tsx`**

Match the approved mock (`.superpowers/brainstorm/.../nightshift-home.html`). Concretely:
- Brand row: `.home-brand` logo tile uses `background: var(--accent); color: var(--on-accent)`.
- Headline: `<h1 className="home-headline">I MIEI<br/><span className="home-headline-accent">CLIENTI</span></h1>` — CSS makes it `font-family: var(--font-display); text-transform: uppercase`.
- Stat-strip (`HomepageStats`): values in `var(--font-display)`, the "sessioni/sett." value gets `.home-stat-value--hot { color: var(--accent) }`.
- Client cards: render `heroMetric(c)` on the right (`.case-card-metric` with `b` in `var(--font-display)`, lime in dark / ink-1 in light), risk dot beside title, meta with **"ultima N gg fa"** wording (use "gg"). Stalled cards add `.case-card--stalled` (critical dot + the "fermo da N gg" caption).

- [ ] **Step 3: Re-skin the home + card CSS in `styles.css`**

Update `.home-hero`, `.home-headline` (display font, uppercase, lime accent), `.home-stats`/`.home-stat*` (display-font values), `.home-actions-bar`, `.case-card` (radius → `var(--radius-4)`, dark surface) and add `.case-card-metric`, `.case-card-metric b { font-family: var(--font-display); color: var(--accent); }`, `[data-theme="light"] .case-card-metric b { color: var(--ink-1); }`, and `.case-card-metric--flat b { color: var(--ink-4); }`.

- [ ] **Step 4: Verify**

Run: `cd frontend && npm run build` → 0 errors.
Browser `http://localhost:5175`: home matches the mock in dark; client cards show hero metrics + "gg" wording; a client with no recent activity shows "—/fermo"; flip to light and confirm numbers go near-black and lime survives only as fills.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/main.tsx frontend/src/styles.css frontend/src/value/personalization.ts
git commit -m "feat(nightshift): home dashboard with per-client hero metric"
```

---

## Task 4: Case detail

**Files:**
- Modify: `frontend/src/screens/CaseDetailView.tsx` (hero, stats vocab, panels, timeline, recommendation, draft-prompt copy)
- Modify: `frontend/src/styles.css` (`.case-prompt-card`, `.stats-card`, `.tab-bar`, `.timeline-*`, `.source-badge`, `.legal-panel`→`.analysis-panel`, hero)

- [ ] **Step 1: Hero block + hero number**

In the case-detail hero, render `heroMetric` (from Task 3) big: `.case-hero-num { font-family: var(--font-display); color: var(--accent); }` + `[data-theme="light"] .case-hero-num { color: var(--ink-1); } .case-hero-num em { color: var(--accent-line); }`. Add the eyebrow + client name (Hanken 800) + meta line per the mock.

- [ ] **Step 2: Vocabulary rename — "contraddizioni" → "segnali"**

In `CaseDetailView.tsx`, replace every UI occurrence of "contraddizion*" with "segnal*" (stat label "segnali", any tab/section heading, empty-state copy). Do NOT rename the underlying data field `contradictions` (model contract); only the displayed strings.

- [ ] **Step 3: De-legalize the next-appointment draft prompt**

Find the `requestDraft('strategy', nextDeadline.title, ...)` call (~line 2363 in the unmodified file). Replace the legal prompt text with a fitness version:

```
`Prepara una bozza operativa per la prossima sessione "${nextDeadline.title}" (${nextDeadline.due_date}${nextDeadline.due_time ? ` alle ${nextDeadline.due_time}` : ''}). Indica le priorità della sessione, cosa preparare/portare, gli esercizi da impostare, i punti di attenzione e i dati da verificare. Contesto: ${nextDeadline.description}`
```

Also scan the file for other legal leftovers ("priorità difensive", "atti", "fascicolo", "giurisprudenza") and rewrite to fitness equivalents.

- [ ] **Step 4: Re-skin the structural CSS**

- `.case-prompt-card` / `.stats-card` / `.tab-bar`: dark surfaces, lime active underline (`.tab-bar button.active { color: var(--accent); border-bottom-color: var(--accent); }`), stat value display-font.
- `.timeline-item` dots → `.time-dot { background: var(--aria); box-shadow: 0 0 0 4px var(--aria-bg); }`.
- `.source-badge` → mono font, `var(--aria-border)` border, `var(--aria-bg)` bg, `var(--aria-ink)` text.
- Rename `.legal-panel`/`.legal-section` → `.analysis-panel`/`.analysis-section` in both CSS and the JSX `className`s.
- Risk row + Aria recommendation card per mock (CTA uses `var(--aria)` fill with `var(--on-accent)`-equivalent dark text; in light `color:#fff` on teal — use `--aria` bg + `#fff` text, which works in both since `--aria` is dark teal in light and bright cyan in dark; for dark cyan use dark text. Implement as `.aria-cta { background: var(--aria); color: var(--paper); }` — `--paper` is near-black in dark (good on cyan) and white-ish in light (BAD on teal). Instead hardcode readable: `.aria-cta { background: var(--aria); color: #06231F; } [data-theme="light"] .aria-cta { color: #fff; }`).

- [ ] **Step 5: Verify**

Run: `cd frontend && npm run build` → 0 errors.
Run: `cd frontend && npm run test:value-messaging` (may fail on renamed strings — that's expected; note which checks break, they're fixed in Task 12).
Browser: open a client → hero number, "segnali" stat, cyan timeline + mono source chips, recommendation CTA all correct in both themes.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/screens/CaseDetailView.tsx frontend/src/styles.css
git commit -m "feat(nightshift): case detail re-skin + fitness vocabulary"
```

---

## Task 5: Aria surfaces (prompt bar + chat)

**Files:**
- Modify: `frontend/src/components/AriaPromptBar.tsx`, `frontend/src/components/ChatPanel.tsx`
- Modify: `frontend/src/styles.css` (`.aria-prompt-*`, `.giulia-ctx-btn`→`.aria-ctx-btn`, chat classes)

- [ ] **Step 1: Rename `.giulia-ctx-btn` → `.aria-ctx-btn`**

In `styles.css` and every JSX `className` (grep: `grep -rn "giulia-ctx-btn" frontend/src`). New style: `background: var(--aria-bg); border: 1px solid var(--aria-border); color: var(--aria-ink);` hover `background: var(--aria); color: #06231F`.

- [ ] **Step 2: Re-skin the Aria prompt bar**

`.aria-prompt-bar` (and drop the `.giulia-prompt-bar` co-selector — grep `giulia-prompt`): `background: var(--aria-bg); border: 1px solid var(--aria-border);` icon `var(--aria)`, input text `var(--ink-2)`, placeholder `var(--ink-4)`, send button `background: var(--aria); color: #06231F; border-radius: var(--radius-2)`.

- [ ] **Step 3: Re-skin chat (`ChatPanel.tsx` + classes)**

FAB cyan (`var(--aria)`); message bubbles: user `var(--paper-sunken)`, Aria `var(--aria-bg)` with `1px solid var(--aria-border)`; streaming caret `var(--aria)`. Use tokens only.

- [ ] **Step 4: Verify**

Run: `cd frontend && npm run build` → 0 errors.
Browser: open chat from FAB; send a message; confirm cyan styling both themes.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AriaPromptBar.tsx frontend/src/components/ChatPanel.tsx frontend/src/styles.css
git commit -m "feat(nightshift): Aria prompt bar + chat in cyan"
```

---

## Task 6: Login / AuthScreen

**Files:**
- Modify: `frontend/src/main.tsx` (AuthScreen + AuthHelp + hero proof-points)
- Modify: `frontend/src/styles.css` (`.auth-*`)

- [ ] **Step 1: Re-skin auth CSS**

`.auth-shell`, `.auth-col`, `.auth-card`, `.auth-intro`, `.auth-disclaimer--card`, `.auth-accept*`, `.auth-help`: dark surfaces (`var(--paper-raised)`), rules, lime primary submit, cyan accents on the hero. Keep the two-column top-aligned grid + mobile stack.

- [ ] **Step 2: Rewrite hero proof-points in athletic voice**

In `AuthScreen`'s hero list, rewrite the feature copy to the coach wedge (e.g. "Trasforma note e misurazioni in un piano", "Aria trova plateau e segnali", "Bozze pronte da rifinire", "Tutto sul tuo dispositivo"). Keep the differentiated headline (do not revert to a generic one). Keep the mandatory disclaimer checkbox gating submit.

- [ ] **Step 3: Verify**

Run: `cd frontend && npm run build` → 0 errors.
Run: `cd frontend && npm run test:auth-onboarding` (note breakages from copy/class changes for Task 12).
Browser: load with `VITE_BYPASS_AUTH` off OR temporarily render AuthScreen; confirm dark login + checkbox gate + both themes.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/main.tsx frontend/src/styles.css
git commit -m "feat(nightshift): login screen re-skin + athletic proof-points"
```

---

## Task 7: First-run / Aria setup wizard

**Files:**
- Modify: `frontend/src/value/PanelModal.tsx`, `frontend/src/value/FirstRunWizard.tsx`, `frontend/src/value/value.css`

- [ ] **Step 1: Remove the forced-dark override, theme natively**

`value.css` currently forces dark inside `.value-modal` (the override added earlier when the app was light). Now the app IS dark by default, so REMOVE the `color-scheme: dark` + the `--paper-sunken`/`--ink-*`/`--sigillo`/etc. overrides inside `.value-modal` — the modal should inherit the app theme. Keep the modal layout (backdrop, card, dots, nav).

- [ ] **Step 2: Re-skin wizard chips + buttons**

`.aria-choice-chip` → `border: 1px solid var(--rule); background: var(--paper-sunken); color: var(--ink-2);`, `--on` state `border-color: var(--accent); background: var(--accent-soft); color: var(--ink-1);`. `.aria-other-input` uses tokens. The "Salva e inizia"/"Aggiorna" button = `.primary-button` (lime). `.value-modal` surface = `var(--paper-raised)`.

- [ ] **Step 3: Verify**

Run: `cd frontend && npm run build` → 0 errors.
Browser: open Profile → "Modifica configurazione Aria" (editMode) to see the wizard; confirm it matches the app theme in BOTH dark and light (no longer hardcoded dark). Also confirm chips/inputs are readable in light.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/value/PanelModal.tsx frontend/src/value/FirstRunWizard.tsx frontend/src/value/value.css
git commit -m "feat(nightshift): Aria setup wizard themed natively (drop forced-dark)"
```

---

## Task 8: Upload drawer

**Files:**
- Modify: `frontend/src/components/MultiFileUploadDrawer.tsx`, `frontend/src/styles.css` (`.upload-*`, `.drop-zone*`)

- [ ] **Step 1: Re-skin drawer surfaces + states**

`.source-drawer`/`.upload-drawer` `var(--paper-raised)`; `.drop-zone` dashed `var(--rule-strong)` on `var(--paper-sunken)`, hover/drag `border-color: var(--accent); background: var(--accent-soft)`; `.upload-tab.active` lime; queue item states uploading=`--accent`/`--accent-soft`, done=`--success`/`--success-soft`, error=`--critical`/`--critical-soft`. URL-import section is Aria-adjacent → `var(--aria-bg)`/`var(--aria-border)`. Rename any `--giur` doc-class leftover and "giurisprudenza" copy → documento.

- [ ] **Step 2: Re-skin the "Personalizzazione pronta" preview + focus chips**

`.upload-aria-preview` → `var(--aria-bg)`/`var(--aria-border)`; `.upload-focus-chip--on` → lime accent (`--accent` border + `--accent-soft` bg + `--ink-1` text).

- [ ] **Step 3: Verify**

Run: `cd frontend && npm run build` → 0 errors.
Browser: create/open a client → upload drawer; confirm drop zone, tabs, a queued item's states, the preview, both themes.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/MultiFileUploadDrawer.tsx frontend/src/styles.css
git commit -m "feat(nightshift): upload drawer re-skin"
```

---

## Task 9: App-lock (PIN / biometric)

**Files:**
- Modify: `frontend/src/lock/LockScreen.tsx`, `frontend/src/lock/LockSetup.tsx`, `frontend/src/lock/lock.css`

- [ ] **Step 1: Re-skin lock screens**

`lock.css`: full-screen `var(--paper)`; PIN keypad keys `var(--paper-raised)` border `var(--rule)`; entered digit / active dot `var(--accent)`; biometric affordance `var(--aria)`; error shake text `var(--critical)`. Setup form inputs use tokens. Keep the "Logout" escape-hatch button styled as `.ghost-button`.

- [ ] **Step 2: Verify**

Run: `cd frontend && npm run build` → 0 errors.
Run: `cd frontend && npm run test:app-lock` → passes (logic unchanged).
Browser: set a PIN (Profile) then reload to hit the lock screen; confirm both themes.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lock/LockScreen.tsx frontend/src/lock/LockSetup.tsx frontend/src/lock/lock.css
git commit -m "feat(nightshift): app-lock screens re-skin"
```

---

## Task 10: Onboarding spotlight tour

**Files:**
- Modify: `frontend/src/onboarding/OnboardingWizard.tsx`, `frontend/src/onboarding/onboarding.css`

- [ ] **Step 1: Re-skin tour tooltip + spotlight**

`onboarding.css`: `.tour-tooltip` `var(--paper-raised)` + `1px solid var(--rule)` + `var(--shadow-3)`; title Hanken 800; `.tour-*-ok`/primary = lime; spotlight ring uses `var(--accent)` glow. Ensure tooltip text is `var(--ink-1/2)`. No hardcoded hex.

- [ ] **Step 2: Verify**

Run: `cd frontend && npm run build` → 0 errors.
Browser: clear onboarding-dismissed key, reload → tour appears; confirm tooltip legibility in both themes.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/onboarding/OnboardingWizard.tsx frontend/src/onboarding/onboarding.css
git commit -m "feat(nightshift): onboarding tour re-skin"
```

---

## Task 11: Profile drawer + theme toggle

**Files:**
- Modify: `frontend/src/components/AccountControls.tsx`, `frontend/src/styles.css`

- [ ] **Step 1: Add the theme toggle UI**

In `ProfileDrawer`, add a three-way control (Scuro / Chiaro / Auto) near the top of the drawer body. Wire to `theme.ts`:

```tsx
import { getThemeChoice, setThemeChoice, type ThemeChoice } from '../theme/theme';
// inside ProfileDrawer:
const [theme, setTheme] = useState<ThemeChoice>(getThemeChoice());
const pickTheme = (c: ThemeChoice) => { setThemeChoice(c); setTheme(c); };
// render a .theme-toggle segmented control with three buttons; active = theme === c
```

```tsx
<div className="theme-toggle" role="group" aria-label="Tema">
  {(['dark','light','auto'] as ThemeChoice[]).map(c => (
    <button key={c} className={theme === c ? 'active' : ''} onClick={() => pickTheme(c)}>
      {c === 'dark' ? 'Scuro' : c === 'light' ? 'Chiaro' : 'Auto'}
    </button>
  ))}
</div>
```

- [ ] **Step 2: Style `.theme-toggle` + re-skin the drawer**

`.theme-toggle` segmented control on `var(--paper-sunken)` with active = `var(--paper-raised)` + lime text/underline. Re-skin the rest of `ProfileDrawer` surfaces/buttons to tokens. Keep all existing entries (Modifica configurazione Aria, LockManager, Cosa fa Aria, suggestions toggle, logout).

- [ ] **Step 3: Verify**

Run: `cd frontend && npm run build` → 0 errors.
Browser: open Profile → toggle Scuro/Chiaro/Auto → theme switches live and persists across reload (per-user key). Confirm Auto follows OS setting.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/AccountControls.tsx frontend/src/styles.css
git commit -m "feat(nightshift): profile drawer re-skin + theme toggle (dark/light/auto)"
```

---

## Task 12: Cleanup, smoke tests, docs

**Files:**
- Modify: `frontend/src/tokens.css` (drop aliases)
- Modify: `frontend/scripts/check-value-messaging.mjs`, `frontend/scripts/check-auth-onboarding.mjs`
- Modify: `README.md`, `CURRENT-TASK.md`, `docs/port-login-to-plt.md`

- [ ] **Step 1: Drop the back-compat aliases**

Remove the alias block at the bottom of `:root` in `tokens.css` (`--sigillo*`, `--giulia-*`). Then:

Run: `grep -rn "var(--sigillo" frontend/src ; grep -rn "var(--giulia" frontend/src`
Expected: NO matches. If any remain, replace each with the correct new token (`--accent*` / `--aria*`) in its file, then re-run until clean.

- [ ] **Step 2: Grep for stray legacy identity**

Run: `grep -rniE "newsreader|satoshi|giulia|giurisprudenz|fascicol|contraddizion|sigillo" frontend/src`
Expected: only legitimate matches (e.g. a data field `contradictions` is fine; any UI string/class/font is not). Fix stray UI/copy/class hits.

- [ ] **Step 3: Update smoke tests**

In `check-value-messaging.mjs` and `check-auth-onboarding.mjs`, update assertions that referenced changed copy/class names (e.g. "contraddizioni"→"segnali", giulia→aria, headline copy). Each check should reflect the new reality.

Run: `cd frontend && npm run test:value-messaging && npm run test:auth-onboarding`
Expected: both pass.

- [ ] **Step 4: Full smoke sweep + build**

Run:
```bash
cd frontend && npm run build \
  && npm run test:spr-export && npm run test:local-case-scope \
  && npm run test:draft-workspace && npm run test:draft-workspace-ui \
  && npm run test:auth-onboarding && npm run test:app-lock \
  && npm run test:session-expiry && npm run test:value-messaging && npm run test:value-cadence
```
Expected: build 0 errors; all smoke scripts pass.

- [ ] **Step 5: Update docs**

- `README.md`: feature list + "Design system" note → Nightshift/Daylight, Anton+Hanken+JetBrains, dark default + theme toggle; codebase tree add `src/theme/theme.ts`.
- `CURRENT-TASK.md`: new DONE section for the Nightshift redesign.
- `docs/port-login-to-plt.md`: note that the visual identity intentionally **diverged** from PLT (Nightshift is SchedaPRO-only — NOT to port).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/tokens.css frontend/scripts/check-value-messaging.mjs frontend/scripts/check-auth-onboarding.mjs README.md CURRENT-TASK.md docs/port-login-to-plt.md
git commit -m "chore(nightshift): drop token aliases, update smoke tests + docs"
```

- [ ] **Step 7: Final in-browser QA, both themes, every screen**

Walk the whole app at `http://localhost:5175` in dark, then light: login → home → create client → upload → case detail (all tabs) → analyze → chat → profile (theme toggle, edit Aria) → lock. Confirm no light-on-light / dark-on-dark contrast failures, no leftover bordeaux/serif, "gg" wording everywhere days appear.

---

## Self-Review

**Spec coverage:** tokens both themes (T1) ✓; fonts (T1) ✓; no-FOUC + default dark + prefers-color-scheme (T1) ✓; theme toggle in Profile (T11) ✓; numbers-as-hero home+case (T3,T4) ✓; Aria owns cyan (T5, + per-screen) ✓; lime=action (T2 buttons, per-screen) ✓; source chips kept (T4) ✓; vocab rename map — tokens/classes (T5,T4,T8,T12), "contraddizioni"→"segnali" (T4), draft copy (T4), giulia/legal-panel/giur (T4,T5,T8,T12) ✓; "gg" convention (T3,T4 + final sweep T12) ✓; per-screen: home (T3), case (T4), login (T6), wizard (T7), upload (T8), chat (T5), lock (T9), profile (T11), onboarding (T10), empty/loading/banners (T2) ✓; both-theme verification each task ✓; smoke tests + docs (T12) ✓; worktree/branch (T0 + already created) ✓; non-goals (IA rework deferred, backend untouched) respected ✓.

**Placeholder scan:** no TBD/TODO. The one "inspect actual type" instruction (T3 Step 1) is a deliberate, bounded lookup with a defined output shape and a fallback rule — not a placeholder.

**Type consistency:** `HeroMetric` defined once (T3) and consumed in T3/T4; `ThemeChoice`/`applyTheme`/`getThemeChoice`/`setThemeChoice` defined in T1 (`theme.ts`) and used consistently in T1 boot + T11 toggle. `--accent`/`--aria` token names consistent across tasks; aliases removed only in T12 after all renames.
