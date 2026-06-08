# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated, Nightshift-styled Settings page that consolidates all existing settings (today scattered in the Profile drawer) plus new prefs (units/format, AI defaults, data management, about), on branch `nightshift`.

**Architecture:** A new `settings/` module: a tiny per-user prefs store (`settingsStore.ts`) + display-format helpers (`format.ts`), and a full-page `SettingsScreen` reached via a new `'settings'` app view. The Profile drawer slims to identity + "Apri Impostazioni" + Logout; all current drawer settings MOVE into the page. New prefs apply immediately (write-through); Supabase profile fields keep their Save. Existing subsystems (theme.ts, appLock, seen, sprExport, db, redaction) are reused — the page is a consolidating UI + one small store.

**Tech Stack:** React 19 + Vite 6 + TS, CSS custom properties (Nightshift tokens), per-user `userKey` localStorage. Verification: `npm run build` (0 TS errors) + `check-*.mjs` smoke tests (incl. a new `check-settings-prefs.mjs`) + in-browser both themes. Dev server: `cd frontend && VITE_BYPASS_AUTH=true npm run dev -- --port 5175`.

**Spec:** `docs/superpowers/specs/2026-06-08-settings-page-design.md`

**Verification note:** Frontend work — "verify" per task = build exits 0, relevant smoke scripts pass, screen renders correctly in dark AND light. All work in worktree `/home/deckard/projects/schedapro-nightshift` on branch `nightshift`.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `frontend/src/settings/settingsStore.ts` | **New** — `AppPrefs` type, `getPrefs`/`setPref`/`subscribe`, `userKey('app-prefs:v1')` | 1 |
| `frontend/src/settings/format.ts` | **New** — `formatWeight(kg)`, `formatLength(cm)` reading prefs | 1 |
| `frontend/src/dateUtils.ts` | Extend formatters to honor `dateFormat` pref | 1 |
| `frontend/scripts/check-settings-prefs.mjs` | **New** — smoke test for store + format helpers | 1 |
| `frontend/package.json` | add `test:settings-prefs` script | 1 |
| `frontend/src/settings/SettingsScreen.tsx` | **New** — page shell + section composition | 2 |
| `frontend/src/settings/sections/*.tsx` | **New** — one component per section | 3–9 |
| `frontend/src/main.tsx` | add `'settings'` view + render + open handler | 2 |
| `frontend/src/components/AccountControls.tsx` | slim drawer → identity + Apri Impostazioni + Logout | 2 |
| `frontend/src/styles.css` | `.settings-*` styles | 2 |
| `frontend/src/screens/CaseDetailView.tsx` | route weight/measure/date displays through format helpers | 6 |
| `frontend/vite.config.ts` | inject app version for the About section | 9 |
| `README.md`, `CURRENT-TASK.md` | docs | 10 |

---

## Task 1: Prefs store + format helpers + dateUtils

**Files:** Create `frontend/src/settings/settingsStore.ts`, `frontend/src/settings/format.ts`, `frontend/scripts/check-settings-prefs.mjs`; modify `frontend/src/dateUtils.ts`, `frontend/package.json`.

- [ ] **Step 1: Write the smoke test (`frontend/scripts/check-settings-prefs.mjs`)**

```js
// Runtime check for settings prefs store + format helpers (no DOM).
import assert from 'node:assert';

// Minimal localStorage + userKey shim so the modules run under node.
globalThis.localStorage = (() => {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
})();

const { getPrefs, setPref, DEFAULT_PREFS } = await import('../src/settings/settingsStore.ts');
const { formatWeight, formatLength } = await import('../src/settings/format.ts');

// Defaults
assert.deepEqual(getPrefs(), DEFAULT_PREFS, 'getPrefs returns defaults when empty');
assert.equal(DEFAULT_PREFS.weightUnit, 'kg');

// kg default formatting
assert.equal(formatWeight(80), '80 kg');
// switch to lb → converts + suffixes
setPref('weightUnit', 'lb');
assert.equal(formatWeight(80), '176 lb'); // 80 * 2.20462 = 176.37 → rounded 176
// length
assert.equal(formatLength(180), '180 cm');
setPref('lengthUnit', 'in');
assert.equal(formatLength(180), '71 in'); // 180 / 2.54 = 70.9 → 71

console.log('settings-prefs checks passed');
```

- [ ] **Step 2: Run it to confirm it fails (modules absent)**

Run: `cd frontend && node scripts/check-settings-prefs.mjs`
Expected: FAIL (cannot find `../src/settings/settingsStore.ts`).

- [ ] **Step 3: Implement `frontend/src/settings/settingsStore.ts`**

```ts
import { userKey } from '../storage/userStorage';

export interface AppPrefs {
  weightUnit: 'kg' | 'lb';
  lengthUnit: 'cm' | 'in';
  dateFormat: 'dmy' | 'mdy' | 'iso';
  weekStart: 'mon' | 'sun';
  anonymizeByDefault: boolean;
  defaultAnalysisMode: 'flash' | 'pro';
  confirmBeforePro: boolean;
}

export const DEFAULT_PREFS: AppPrefs = {
  weightUnit: 'kg', lengthUnit: 'cm', dateFormat: 'dmy', weekStart: 'mon',
  anonymizeByDefault: false, defaultAnalysisMode: 'flash', confirmBeforePro: true,
};

const KEY = 'app-prefs:v1';
const listeners = new Set<() => void>();

export function getPrefs(): AppPrefs {
  try {
    const raw = localStorage.getItem(userKey(KEY));
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch { return { ...DEFAULT_PREFS }; }
}

export function setPref<K extends keyof AppPrefs>(key: K, value: AppPrefs[K]): void {
  const next = { ...getPrefs(), [key]: value };
  localStorage.setItem(userKey(KEY), JSON.stringify(next));
  listeners.forEach(fn => fn());
}

export function subscribePrefs(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
```

- [ ] **Step 4: Implement `frontend/src/settings/format.ts`**

```ts
import { getPrefs } from './settingsStore';

const LB_PER_KG = 2.20462;
const CM_PER_IN = 2.54;

/** Canonical storage is kg. Converts + suffixes per the user's weightUnit pref. */
export function formatWeight(kg: number | null | undefined): string {
  if (kg == null || !Number.isFinite(kg)) return '—';
  const p = getPrefs();
  if (p.weightUnit === 'lb') return `${Math.round(kg * LB_PER_KG)} lb`;
  return `${Math.round(kg * 10) / 10} kg`;
}

/** Canonical storage is cm. Converts + suffixes per the user's lengthUnit pref. */
export function formatLength(cm: number | null | undefined): string {
  if (cm == null || !Number.isFinite(cm)) return '—';
  const p = getPrefs();
  if (p.lengthUnit === 'in') return `${Math.round(cm / CM_PER_IN)} in`;
  return `${Math.round(cm)} cm`;
}
```

- [ ] **Step 5: Extend `frontend/src/dateUtils.ts` to honor `dateFormat`**

Read the current `formatDate`/`formatShortDate`/`formatDateFull` (they use `Intl.DateTimeFormat('it-IT', …)`). Add at the top: `import { getPrefs } from './settings/settingsStore';`. In `formatDate` (the dd/mm/yyyy-style one), pick the order from the pref:

```ts
export function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  switch (getPrefs().dateFormat) {
    case 'mdy': return `${mm}/${dd}/${yyyy}`;
    case 'iso': return `${yyyy}-${mm}-${dd}`;
    default:    return `${dd}/${mm}/${yyyy}`;
  }
}
```
Leave `formatShortDate`/`formatDateFull` as-is unless trivial to honor the pref (they may use month names — keep them; the numeric `formatDate` is the one that respects the pref). Do NOT break existing call sites (signature unchanged).

- [ ] **Step 6: Add the npm script** in `frontend/package.json` scripts: `"test:settings-prefs": "node scripts/check-settings-prefs.mjs"`. (If node can't import `.ts` directly, the repo already runs other `check-*.mjs` that import `.ts` — match how they do it; e.g. they may rely on a loader. If a loader flag is needed, mirror the sibling scripts exactly.)

- [ ] **Step 7: Run the test to confirm it passes**

Run: `cd frontend && npm run test:settings-prefs`
Expected: `settings-prefs checks passed`.

- [ ] **Step 8: Build**

Run: `cd frontend && npm run build` → exits 0.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/settings/settingsStore.ts frontend/src/settings/format.ts frontend/src/dateUtils.ts frontend/scripts/check-settings-prefs.mjs frontend/package.json
git commit -m "feat(settings): prefs store + format helpers + date format pref"
```

---

## Task 2: SettingsScreen shell + routing + slimmed Profile drawer

**Files:** Create `frontend/src/settings/SettingsScreen.tsx`; modify `frontend/src/main.tsx`, `frontend/src/components/AccountControls.tsx`, `frontend/src/styles.css`.

- [ ] **Step 1: Create `SettingsScreen.tsx` shell**

```tsx
import { ArrowLeft } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

export default function SettingsScreen({ session, onBack }: { session: Session; onBack: () => void }) {
  return (
    <main className="app-shell settings-shell">
      <div className="settings-topbar">
        <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Indietro</button>
        <h1 className="settings-title">Impostazioni</h1>
      </div>
      {/* sections added in later tasks */}
    </main>
  );
}
```

- [ ] **Step 2: Add the `'settings'` view in `main.tsx`**

`type View = 'cases' | 'case' | 'settings';` (line ~843). Add render branch alongside the existing `view === 'case'` block (~1069):

```tsx
{view === 'settings' && session && (
  <Suspense fallback={<div className="loading-shell"><Loader2 className="spin" size={28} /></div>}>
    <SettingsScreen session={session} onBack={() => setView('cases')} />
  </Suspense>
)}
```
Add a lazy import near the other screen import: `const SettingsScreen = React.lazy(() => import('./settings/SettingsScreen'));`. Ensure the `cases`/`case` views are hidden when `view === 'settings'` (mirror how `case` hides `cases`).

- [ ] **Step 3: Give `AccountControls` an `onOpenSettings` prop and slim the drawer**

In `AccountControls.tsx`: add `onOpenSettings` to the component props and thread it to `ProfileDrawer`. In `ProfileDrawer`, REMOVE the settings controls that now live on the page — but DO NOT delete their code yet; they move in Tasks 3–9. For THIS task, the minimal slice: keep the drawer working, add a prominent **"Apri Impostazioni"** button (calls `onOpenSettings` then `onClose`), keep Logout, keep identity (name/email). Leave the existing sections in place for now (they'll be removed as each is re-homed) — OR, cleaner: comment that subsequent tasks remove each moved section. The drawer must still build and function.

In `main.tsx` where `<AccountControls session={session} />` renders (~653), pass `onOpenSettings={() => setView('settings')}`.

- [ ] **Step 4: Style `.settings-*` in styles.css (Nightshift tokens)**

```css
.settings-shell { padding-bottom: 96px; }
.settings-topbar { display: flex; align-items: center; gap: 10px; padding: 12px 0; position: sticky; top: 0; background: var(--paper); z-index: 5; border-bottom: 1px solid var(--rule); }
.settings-title { font-family: var(--font-ui); font-weight: 800; font-size: 1.1rem; margin: 0; }
.settings-section { border: 1px solid var(--rule); background: var(--paper-raised); border-radius: var(--radius-3); padding: 16px; margin-top: 14px; }
.settings-section-label { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-3); margin: 0 0 12px; display: flex; align-items: center; gap: 7px; }
.settings-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 11px 0; border-top: 1px solid var(--rule); }
.settings-row:first-of-type { border-top: none; }
.settings-row-label { font-size: 0.9rem; color: var(--ink-1); }
.settings-row-desc { font-size: 0.78rem; color: var(--ink-3); margin-top: 2px; }
.settings-row-control { flex: none; }
.settings-danger { color: var(--critical); }
```

- [ ] **Step 5: Build + browser check**

Run: `cd frontend && npm run build` → 0 errors. Browser: open Profile drawer → "Apri Impostazioni" → lands on the Settings page with the topbar; back returns home. Both themes.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/settings/SettingsScreen.tsx frontend/src/main.tsx frontend/src/components/AccountControls.tsx frontend/src/styles.css
git commit -m "feat(settings): page shell + routing + Apri Impostazioni entry"
```

---

## Task 3: Sections — Aspetto + Account

**Files:** Create `frontend/src/settings/sections/AppearanceSection.tsx`, `frontend/src/settings/sections/AccountSection.tsx`; modify `SettingsScreen.tsx`, `AccountControls.tsx` (remove the theme toggle now living here).

- [ ] **Step 1: `AppearanceSection.tsx`** — the theme segmented control, reusing `theme.ts`:

```tsx
import { useState } from 'react';
import { getThemeChoice, setThemeChoice, type ThemeChoice } from '../../theme/theme';

export default function AppearanceSection() {
  const [theme, setTheme] = useState<ThemeChoice>(getThemeChoice());
  const pick = (c: ThemeChoice) => { setThemeChoice(c); setTheme(c); };
  return (
    <section className="settings-section">
      <p className="settings-section-label">Aspetto</p>
      <div className="settings-row">
        <div><div className="settings-row-label">Tema</div></div>
        <div className="settings-row-control theme-toggle" role="group" aria-label="Tema">
          {(['dark','light','auto'] as ThemeChoice[]).map(c => (
            <button key={c} type="button" className={theme === c ? 'active' : ''} onClick={() => pick(c)}>
              {c === 'dark' ? 'Scuro' : c === 'light' ? 'Chiaro' : 'Auto'}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `AccountSection.tsx`** — email (read-only), Cambia password (reset email), Logout:

```tsx
import { supabase } from '../../supabaseClient';
import { LogOut } from 'lucide-react';

export default function AccountSection({ email }: { email: string | undefined }) {
  const changePassword = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    alert(error ? `Errore: ${error.message}` : 'Ti abbiamo inviato un’email per reimpostare la password.');
  };
  const logout = () => { if (confirm('Vuoi davvero uscire dall’account?')) supabase.auth.signOut(); };
  return (
    <section className="settings-section">
      <p className="settings-section-label">Account</p>
      <div className="settings-row">
        <div><div className="settings-row-label">Email</div><div className="settings-row-desc">{email ?? '—'}</div></div>
      </div>
      <div className="settings-row">
        <div><div className="settings-row-label">Password</div><div className="settings-row-desc">Ti inviamo un’email per reimpostarla</div></div>
        <button className="ghost-button settings-row-control" onClick={changePassword}>Cambia password</button>
      </div>
      <div className="settings-row">
        <div><div className="settings-row-label">Esci dall’account</div></div>
        <button className="ghost-button settings-row-control" onClick={logout}><LogOut size={15} /> Logout</button>
      </div>
    </section>
  );
}
```
(Use proper apostrophes in the actual file, not the escapes shown.)

- [ ] **Step 3: Compose in `SettingsScreen.tsx`** — render `<AccountSection email={session.user.email} />` then `<AppearanceSection />` after the topbar.

- [ ] **Step 4: Remove the theme toggle from the Profile drawer** in `AccountControls.tsx` (it now lives in settings). Keep the drawer building.

- [ ] **Step 5: Build + browser** — both sections render; theme toggle still switches live (now from settings); both themes.

Run: `cd frontend && npm run build` → 0 errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/settings/sections/AppearanceSection.tsx frontend/src/settings/sections/AccountSection.tsx frontend/src/settings/SettingsScreen.tsx frontend/src/components/AccountControls.tsx
git commit -m "feat(settings): Aspetto + Account sections"
```

---

## Task 4: Section — Profilo / Studio

**Files:** Create `frontend/src/settings/sections/ProfileSection.tsx`; modify `SettingsScreen.tsx`, `AccountControls.tsx` (remove the profile fields + Save now living here).

- [ ] **Step 1: Build `ProfileSection.tsx`** by MOVING the existing profile-fields logic out of `ProfileDrawer` (the `profile` state, the `supabase.from('profiles').select(...).eq('id', session.user.id)` load, the inputs for full_name/studio/phone, and the `handleSave` write + `.profile-save` button). Same Supabase behavior, same field keys (`full_name`, `studio`, `phone`), wrapped in a `.settings-section` with label "Profilo / Studio". Signature: `ProfileSection({ session }: { session: Session })`.

- [ ] **Step 2: Render `<ProfileSection session={session} />`** in `SettingsScreen.tsx` (after Account, before Appearance or grouped sensibly — order: Account, Profilo, Aspetto).

- [ ] **Step 3: Remove the moved profile fields + Save from `ProfileDrawer`** in `AccountControls.tsx`.

- [ ] **Step 4: Build + browser** — profile loads, edits, saves to Supabase from the settings page; drawer no longer shows the fields.

Run: `cd frontend && npm run build` → 0 errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/settings/sections/ProfileSection.tsx frontend/src/settings/SettingsScreen.tsx frontend/src/components/AccountControls.tsx
git commit -m "feat(settings): Profilo / Studio section"
```

---

## Task 5: Section — Aria (AI)

**Files:** Create `frontend/src/settings/sections/AriaSection.tsx`; modify `SettingsScreen.tsx`, `AccountControls.tsx` (remove "Modifica configurazione Aria" now here), and the analyze entry point that should honor `defaultAnalysisMode`.

- [ ] **Step 1: `AriaSection.tsx`** — three controls:
  1. "Modifica configurazione Aria" button → opens `FirstRunWizard` in `editMode` with `initialValues={loadAriaSetup() ?? undefined}` (move this logic, currently in `AccountControls`, into this section; manage a local `showEdit` state and render `<FirstRunWizard editMode initialValues={...} onComplete={() => setShowEdit(false)} />`).
  2. Default analisi: a segmented control (`flash`/`pro`) reading/writing `getPrefs().defaultAnalysisMode` via `setPref('defaultAnalysisMode', …)`.
  3. "Chiedi sempre conferma prima di Pro" toggle → `confirmBeforePro` pref.

```tsx
import { useState } from 'react';
import FirstRunWizard from '../../value/FirstRunWizard';
import { loadAriaSetup, type AriaSetup } from '../../value/personalization';
import { getPrefs, setPref } from '../settingsStore';

export default function AriaSection() {
  const [showEdit, setShowEdit] = useState(false);
  const [initial, setInitial] = useState<AriaSetup | undefined>(undefined);
  const [mode, setMode] = useState(getPrefs().defaultAnalysisMode);
  const [confirmPro, setConfirmPro] = useState(getPrefs().confirmBeforePro);
  const openEdit = () => { setInitial(loadAriaSetup() ?? undefined); setShowEdit(true); };
  return (
    <section className="settings-section">
      <p className="settings-section-label">Aria (AI)</p>
      <div className="settings-row">
        <div><div className="settings-row-label">Configurazione Aria</div><div className="settings-row-desc">Specialità, formato bozze, tono</div></div>
        <button className="ghost-button settings-row-control" onClick={openEdit}>Modifica</button>
      </div>
      <div className="settings-row">
        <div><div className="settings-row-label">Analisi predefinita</div></div>
        <div className="settings-row-control theme-toggle" role="group" aria-label="Analisi predefinita">
          {(['flash','pro'] as const).map(m => (
            <button key={m} type="button" className={mode === m ? 'active' : ''}
              onClick={() => { setPref('defaultAnalysisMode', m); setMode(m); }}>
              {m === 'flash' ? 'Flash' : 'Pro'}
            </button>
          ))}
        </div>
      </div>
      <label className="settings-row" style={{ cursor: 'pointer' }}>
        <div><div className="settings-row-label">Conferma prima di Pro</div><div className="settings-row-desc">Chiedi sempre conferma per le analisi Pro (consumano più crediti)</div></div>
        <input type="checkbox" className="settings-row-control" checked={confirmPro}
          onChange={e => { setPref('confirmBeforePro', e.target.checked); setConfirmPro(e.target.checked); }} />
      </label>
      {showEdit && <FirstRunWizard editMode initialValues={initial} onComplete={() => setShowEdit(false)} />}
    </section>
  );
}
```

- [ ] **Step 2: Honor `defaultAnalysisMode`** at the analyze entry. Find where the default analyze mode is chosen (the Analizza button / `requestAnalyze` default param in `CaseDetailView.tsx`). Where it currently defaults to `'flash'`, read `getPrefs().defaultAnalysisMode` instead so the user's preference drives the default. (Keep Pro's pre-flight confirm; `confirmBeforePro` stays ON behavior — the modal already confirms.)

- [ ] **Step 3: Render `<AriaSection />`** in `SettingsScreen.tsx`; **remove** the "Modifica configurazione Aria" button + its `showAriaEdit` wizard wiring from `AccountControls.tsx` (now in the section).

- [ ] **Step 4: Build + browser** — edit-Aria opens the wizard from settings; mode toggle persists; analyze respects the default.

Run: `cd frontend && npm run build` → 0 errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/settings/sections/AriaSection.tsx frontend/src/settings/SettingsScreen.tsx frontend/src/components/AccountControls.tsx frontend/src/screens/CaseDetailView.tsx
git commit -m "feat(settings): Aria section + default analysis mode pref"
```

---

## Task 6: Section — Unità & formato (+ wire displays)

**Files:** Create `frontend/src/settings/sections/UnitsSection.tsx`; modify `SettingsScreen.tsx`, `frontend/src/screens/CaseDetailView.tsx`.

- [ ] **Step 1: `UnitsSection.tsx`** — four segmented controls writing prefs (`weightUnit`, `lengthUnit`, `dateFormat`, `weekStart`), each pattern identical to the theme toggle:

```tsx
import { useState } from 'react';
import { getPrefs, setPref, type AppPrefs } from '../settingsStore';

function Seg<K extends keyof AppPrefs>({ label, k, opts }:
  { label: string; k: K; opts: [AppPrefs[K], string][] }) {
  const [val, setVal] = useState(getPrefs()[k]);
  return (
    <div className="settings-row">
      <div><div className="settings-row-label">{label}</div></div>
      <div className="settings-row-control theme-toggle" role="group" aria-label={label}>
        {opts.map(([v, lbl]) => (
          <button key={String(v)} type="button" className={val === v ? 'active' : ''}
            onClick={() => { setPref(k, v); setVal(v); }}>{lbl}</button>
        ))}
      </div>
    </div>
  );
}

export default function UnitsSection() {
  return (
    <section className="settings-section">
      <p className="settings-section-label">Unità &amp; formato</p>
      <Seg label="Peso" k="weightUnit" opts={[['kg','kg'],['lb','lb']]} />
      <Seg label="Lunghezza" k="lengthUnit" opts={[['cm','cm'],['in','in']]} />
      <Seg label="Formato data" k="dateFormat" opts={[['dmy','gg/mm/aaaa'],['mdy','mm/gg/aaaa'],['iso','aaaa-mm-gg']]} />
      <Seg label="Inizio settimana" k="weekStart" opts={[['mon','Lun'],['sun','Dom']]} />
    </section>
  );
}
```

- [ ] **Step 2: Route weight/length displays through the helpers.** In `CaseDetailView.tsx`, find where body weight / measurements are rendered (the "Profilo & misurazioni" area / any `kg`/`cm` literal next to a value). Replace raw rendering with `formatWeight(valueKg)` / `formatLength(valueCm)` from `../settings/format`. Import: `import { formatWeight, formatLength } from '../settings/format';`. Date displays already flow through `dateUtils.formatDate` (updated in Task 1) — no change needed there. (Grep `grep -nE "kg|cm" src/screens/CaseDetailView.tsx` to find sites; convert display only, leave stored values canonical.)

- [ ] **Step 3: Render `<UnitsSection />`** in `SettingsScreen.tsx`.

- [ ] **Step 4: Build + browser** — switching kg↔lb / cm↔in updates the displayed measurements on a client (canonical data unchanged); date format pref changes `formatDate` output. Both themes.

Run: `cd frontend && npm run build` → 0 errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/settings/sections/UnitsSection.tsx frontend/src/settings/SettingsScreen.tsx frontend/src/screens/CaseDetailView.tsx
git commit -m "feat(settings): units & format section + display wiring"
```

---

## Task 7: Section — Privacy & sicurezza

**Files:** Create `frontend/src/settings/sections/PrivacySection.tsx`; modify `SettingsScreen.tsx`, `AccountControls.tsx` (remove `LockManager` now here). Reuse the existing `LockManager` component (move it into the section or import it).

- [ ] **Step 1: Move `LockManager`** (currently a local component in `AccountControls.tsx`) into its own file `frontend/src/lock/LockManager.tsx` exporting it, so both the section and (if needed) elsewhere can import it. Keep its logic identical (PIN set/change/remove, biometric toggle, reading `appLock`).

- [ ] **Step 2: `PrivacySection.tsx`** — compose:
  1. `<LockManager userId={session.user.id} />`.
  2. Idle timeout select reading/writing `appLock`'s `idleTimeoutMin` (use the existing setter — grep `appLock.ts` for the function that sets `idleTimeoutMin`, e.g. `setIdleTimeout(userId, minutes)`; options 1/5/15/Mai where "Mai" = a large sentinel or 0 per how appLock treats it — read appLock to confirm the disable semantics and match them).
  3. Anonimizzazione di default toggle → `anonymizeByDefault` pref.
  4. "Gestisci regole di anonimizzazione" → opens the existing redaction-rules UI/flow (find how redaction rules are currently managed; link to it).
  5. Auto-logout 72h read-only explainer row.

Concrete control for idle (adapt to real appLock API):
```tsx
// pseudostructure — wire to real appLock getter/setter discovered by reading appLock.ts
const [idle, setIdle] = useState<number>(getLockConfig(userId)?.idleTimeoutMin ?? 5);
// <select> with 1/5/15 and a "Mai" option; onChange → setIdleTimeout(userId, value); setIdle(value)
```

- [ ] **Step 3: Render `<PrivacySection session={session} />`** in `SettingsScreen.tsx`; remove `LockManager` usage from `AccountControls.tsx` (import path now `../lock/LockManager` if anything still needs it; the drawer no longer shows it).

- [ ] **Step 4: Build + browser** — PIN/biometric manageable from settings; idle timeout select persists and affects lock; anonymize toggle persists.

Run: `cd frontend && npm run build` → 0 errors; `npm run test:app-lock` → passes.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lock/LockManager.tsx frontend/src/settings/sections/PrivacySection.tsx frontend/src/settings/SettingsScreen.tsx frontend/src/components/AccountControls.tsx
git commit -m "feat(settings): privacy & security section (lock, idle, anonymize)"
```

---

## Task 8: Section — Dati

**Files:** Create `frontend/src/settings/sections/DataSection.tsx`; modify `SettingsScreen.tsx`.

- [ ] **Step 1: `DataSection.tsx`** — actions, each a row with a button:
  1. **Esporta tutte le schede** — `const cases = await dbList(localOwnerIdFromSession(session)); for (const c of cases) downloadSpr(exportPlainSpr(c), c.case_title)` (reuse the home's single-case download helper pattern; sequential downloads). Use the existing `.spr` download mechanism (find how a single case is exported/downloaded today and loop it).
  2. **Importa** `.spr` — reuse the exact import flow from the home `import-file-input` (file picker → `parseSprFile` → decrypt-or-confirm → `dbSave` → reload). Extract to a shared helper if cleaner, else replicate.
  3. **Svuota chat** — `localStorage.removeItem('spr:chat-messages')` + confirm.
  4. **Reset suggerimenti / onboarding** — clear suggestion/optout/onboarding keys via existing `seen`/`wizardBus` helpers (grep for the reset/clear functions; if none, remove the relevant `userKey('optout:')`/`onboarding:dismissed`/seen keys). Plus a "Rivedi il tour" button that re-triggers onboarding (clear `onboarding:dismissed` then `wizardBus`/reload).
  5. **Cancella dati locali del dispositivo** — DESTRUCTIVE: strong `confirm()` with clear copy, then delete all the user's cases (`for (const c of await dbList(owner)) await dbDelete(owner, c.case_id)`) and remove `spr:`-prefixed keys for this user (`Object.keys(localStorage).filter(k => k.startsWith('spr:'))...` — scope carefully to this user's `userKey` prefix to avoid nuking another user). Then reload. Style the button `.settings-danger`.

- [ ] **Step 2: Render `<DataSection session={session} />`** in `SettingsScreen.tsx`.

- [ ] **Step 3: Build + browser** — export all downloads N `.spr`; import works; svuota chat clears; reset suggestions makes hints/tour reappear; wipe-local (test on throwaway data) clears cases + reloads. Both themes.

Run: `cd frontend && npm run build` → 0 errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/settings/sections/DataSection.tsx frontend/src/settings/SettingsScreen.tsx
git commit -m "feat(settings): data section (export all, import, resets, wipe local)"
```

---

## Task 9: Sections — Suggerimenti/Aiuto + Info

**Files:** Create `frontend/src/settings/sections/HelpSection.tsx`, `frontend/src/settings/sections/AboutSection.tsx`; modify `SettingsScreen.tsx`, `AccountControls.tsx` (remove suggestions toggle + AriaCapabilities now here), `frontend/vite.config.ts`.

- [ ] **Step 1: `HelpSection.tsx`** — suggestions toggle (`areSuggestionsEnabled`/`setSuggestionsEnabled` from `value/seen`), "Rivedi il tour" button (re-trigger onboarding, same mechanism as Task 8 item 4), and a collapsible "Cosa fa Aria" rendering `<AriaCapabilities />`.

- [ ] **Step 2: Inject app version** for About. In `vite.config.ts` add:
```ts
import pkg from './package.json';
// inside defineConfig: define: { __APP_VERSION__: JSON.stringify(pkg.version) }
```
Add a global type so TS knows it: create/extend `frontend/src/vite-env.d.ts` with `declare const __APP_VERSION__: string;`.

- [ ] **Step 3: `AboutSection.tsx`** — version row (`__APP_VERSION__`), links Privacy/Termini (use real routes/URLs if they exist in the app; otherwise omit the link rows rather than fake them), and a one-line credit ("Digital Trainer — coach AI per personal trainer").

- [ ] **Step 4: Render both** in `SettingsScreen.tsx`; **remove** the suggestions toggle + AriaCapabilities from `AccountControls.tsx`. At this point the drawer is fully slimmed (identity + Apri Impostazioni + Logout) — verify nothing settings-y remains in it.

- [ ] **Step 5: Build + browser** — suggestions toggle works from settings; version shows; drawer is now just identity + entry + logout.

Run: `cd frontend && npm run build` → 0 errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/settings/sections/HelpSection.tsx frontend/src/settings/sections/AboutSection.tsx frontend/src/settings/SettingsScreen.tsx frontend/src/components/AccountControls.tsx frontend/vite.config.ts frontend/src/vite-env.d.ts
git commit -m "feat(settings): help + about sections, slimmed Profile drawer"
```

---

## Task 10: Cleanup, smoke sweep, docs

**Files:** modify `frontend/scripts/check-value-messaging.mjs` (if it asserted drawer contents that moved), `README.md`, `CURRENT-TASK.md`.

- [ ] **Step 1: Confirm the drawer is fully slimmed and nothing duplicated.** Read `AccountControls.tsx`: it should now only render identity + "Apri Impostazioni" + Logout (+ the quick top-right Profilo/Logout buttons). No theme/profile/aria/lock/suggestions controls remain there.

- [ ] **Step 2: Fix any smoke test that asserted moved drawer content.** Run `npm run test:value-messaging` and `npm run test:auth-onboarding`; if a check asserted (e.g.) the theme toggle or "Modifica configurazione Aria" lived in `AccountControls`, repoint it to `SettingsScreen`/the section file. Update to assert the NEW reality, don't weaken.

- [ ] **Step 3: Full smoke sweep + build**
```bash
cd frontend && npm run build \
  && npm run test:settings-prefs && npm run test:spr-export && npm run test:local-case-scope \
  && npm run test:draft-workspace && npm run test:draft-workspace-ui \
  && npm run test:auth-onboarding && npm run test:app-lock \
  && npm run test:session-expiry && npm run test:value-messaging && npm run test:value-cadence
```
Expected: build 0 errors; all pass.

- [ ] **Step 4: Docs.**
  - `README.md`: add "Impostazioni" to the feature list (dedicated settings page: account, profilo, aspetto, Aria, unità & formato, privacy & sicurezza, dati, aiuto, info); add `src/settings/` to the codebase tree.
  - `CURRENT-TASK.md`: new DONE section summarizing the settings page (sections, new prefs store, units/format display wiring, slimmed drawer) + the phase-2 deferrals (push notifications, account deletion, avatar). Note it's on branch `nightshift`, pending QA before merge.

- [ ] **Step 5: Commit**

```bash
git add frontend/scripts/check-value-messaging.mjs frontend/scripts/check-auth-onboarding.mjs README.md CURRENT-TASK.md
git commit -m "chore(settings): smoke tests + docs; finalize slimmed drawer"
```

- [ ] **Step 6: Final QA both themes** — walk the full settings page in dark and light: every section renders, every control persists across reload, drawer is slim, units/date prefs reflect on a client. No contrast failures.

---

## Self-Review

**Spec coverage:** structure/drawer-slim/routing (T2) ✓; prefs store + format + date pref (T1) ✓; §1 Account (T3) ✓; §2 Profilo (T4) ✓; §3 Aspetto (T3) ✓; §4 Aria incl. Flash/Pro default + confirm-before-Pro (T5) ✓; §5 Unità & formato + display wiring (T6) ✓; §6 Privacy (lock move, idle expose, anonymize, 72h explainer) (T7) ✓; §7 Dati (export-all, import, svuota chat, reset onboarding, wipe local) (T8) ✓; §8 Suggerimenti/Aiuto (T9) ✓; §9 Info/version (T9) ✓; phase-2 deferrals (not built — respected) ✓; docs + smoke (T10) ✓.

**Placeholder scan:** No TBD/TODO. A few "grep to find the real call site / read appLock to confirm disable semantics" instructions are deliberate, bounded lookups (the exact line isn't known without reading), each with a defined target and output — not vague placeholders. The idle "Mai" sentinel is explicitly "match appLock's existing disable semantics."

**Type consistency:** `AppPrefs` keys (`weightUnit`/`lengthUnit`/`dateFormat`/`weekStart`/`anonymizeByDefault`/`defaultAnalysisMode`/`confirmBeforePro`) defined in T1 and consumed verbatim in T5/T6/T7/T9. `getPrefs`/`setPref`/`DEFAULT_PREFS` consistent across tasks. `formatWeight`/`formatLength` defined T1, used T6. Theme `ThemeChoice`/`getThemeChoice`/`setThemeChoice` reused from the existing theme module. `SettingsScreen({ session, onBack })` and section prop shapes consistent.
