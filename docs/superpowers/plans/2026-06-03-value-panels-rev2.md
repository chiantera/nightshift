# Value Panels (rev 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Evolvere il primo-avvio di Digital Trainer in un wizard a pannelli (stile `ValueIntroModal`), aggiungere pannelli contestuali in-app, una cadenza di ricomparsa (oraria + opt-out fino al login), e un bottone Logout sulla pagina PIN.

**Architecture:** Estende `frontend/src/value/`. Una shell visiva riusabile (`PanelModal`) + un wizard sequenziale (`FirstRunWizard`, sostituisce `ValueIntroModal`) + un pannello contestuale (`InfoPanelModal`). Cadenza/opt-out in `seen.ts`. L'avviso-gate è legato al timestamp 72h di `auth/sessionExpiry`. Login invariato.

**Tech Stack:** React 19 + Vite + TS; lucide-react; localStorage; test `.mjs` (static + runtime con `--experimental-strip-types`).

**Spec:** `docs/superpowers/specs/2026-06-03-digital-trainer-value-messaging-design.md` (sezione "Revisione 2").

**Commit su `main`** con `git commit --no-verify`. Non fare push (lo fa il controller). Esegui `npm run build` + i test indicati prima di ogni commit.

---

## Task 1: cadence + opt-out helpers in seen.ts

**Files:** Modify `frontend/src/value/seen.ts`; Create `frontend/scripts/check-value-cadence.mjs`; Modify `frontend/package.json`; Modify `frontend/scripts/check-value-messaging.mjs`.

- [ ] **Step 1: append helpers to `seen.ts`** (dopo le funzioni esistenti, NON rimuovere nulla):

```ts
// ── Cadenza & opt-out per i pannelli ─────────────────────────────────────────
const HOUR_MS = 60 * 60 * 1000;

export function getLastShown(key: string): number {
  try { const n = Number(localStorage.getItem(`spr:lastshown:${key}`)); return Number.isFinite(n) ? n : 0; } catch { return 0; }
}
export function markShown(key: string, now: number = Date.now()): void {
  try { localStorage.setItem(`spr:lastshown:${key}`, String(now)); } catch { /* noop */ }
}
export function optOutUntilLogin(key: string): void {
  try { localStorage.setItem(`spr:optout:${key}`, '1'); } catch { /* noop */ }
}
export function isOptedOut(key: string): boolean {
  try { return localStorage.getItem(`spr:optout:${key}`) === '1'; } catch { return false; }
}
/** Rimuove tutti gli opt-out: chiamato al login (gli opt-out durano fino al prossimo accesso). */
export function clearLoginOptOuts(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('spr:optout:')) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch { /* noop */ }
}
/** Pannelli a cadenza oraria: visibili se i suggerimenti sono ON, non in opt-out, e >1h dall'ultima volta. */
export function shouldShowHourly(key: string, now: number = Date.now()): boolean {
  return areSuggestionsEnabled() && !isOptedOut(key) && (now - getLastShown(key) > HOUR_MS);
}
```

- [ ] **Step 2: runtime test** — create `frontend/scripts/check-value-cadence.mjs`:

```js
// Runtime: node --experimental-strip-types scripts/check-value-cadence.mjs
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
  clear: () => store.clear(),
  get length() { return store.size; },
  key: (i) => [...store.keys()][i] ?? null,
};
const m = await import('../src/value/seen.ts');
let failed = 0;
const ok = (n, c) => { console.log(`${c ? '✓' : '✗'} ${n}`); if (!c) failed++; };

store.clear();
ok('mai mostrato → shouldShowHourly true', m.shouldShowHourly('w') === true);
m.markShown('w', 1_000_000);
ok('appena mostrato → false', m.shouldShowHourly('w', 1_000_000 + 60_000) === false);
ok('dopo 1h+ → true', m.shouldShowHourly('w', 1_000_000 + 61 * 60_000) === true);
m.optOutUntilLogin('w');
ok('opt-out → false anche dopo ore', m.shouldShowHourly('w', 1_000_000 + 100 * 60_000) === false);
ok('isOptedOut true', m.isOptedOut('w') === true);
m.setSuggestionsEnabled(false);
store.delete('spr:optout:w');
ok('suggerimenti OFF → false', m.shouldShowHourly('w', 9_000_000_000) === false);
m.setSuggestionsEnabled(true);
m.optOutUntilLogin('a'); m.optOutUntilLogin('b');
m.clearLoginOptOuts();
ok('clearLoginOptOuts rimuove tutti gli opt-out', m.isOptedOut('a') === false && m.isOptedOut('b') === false);

if (failed) { console.error(`\n${failed} value-cadence check(s) failed.`); process.exit(1); }
console.log('\nvalue-cadence OK');
```

- [ ] **Step 3: package.json** — add after `"test:value-messaging"`:
```
"test:value-cadence": "node --experimental-strip-types scripts/check-value-cadence.mjs"
```

- [ ] **Step 4: static checks** — in `frontend/scripts/check-value-messaging.mjs` add to `checks`:
```js
{ name: 'seen.ts has cadence + opt-out helpers', pass: /shouldShowHourly/.test(src('value/seen.ts')) && /clearLoginOptOuts/.test(src('value/seen.ts')) && /optOutUntilLogin/.test(src('value/seen.ts')) },
```

- [ ] **Step 5: run** — `cd frontend && npm run test:value-cadence && npm run test:value-messaging && npm run build`. Expect all ✓ + build OK.

- [ ] **Step 6: commit**
```bash
git add frontend/src/value/seen.ts frontend/scripts/check-value-cadence.mjs frontend/scripts/check-value-messaging.mjs frontend/package.json
git commit --no-verify -m "feat: hourly cadence + opt-out-until-login helpers"
```

---

## Task 2: PanelModal shell + CSS

**Files:** Create `frontend/src/value/PanelModal.tsx`; Modify `frontend/src/value/value.css`; Modify `check-value-messaging.mjs`.

- [ ] **Step 1: create `PanelModal.tsx`**
```tsx
import { type ReactNode } from 'react';

/** Shell visiva riusabile per i pannelli (backdrop scuro + card). */
export default function PanelModal({ children, labelledBy }: { children: ReactNode; labelledBy?: string }) {
  return (
    <div className="value-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className="value-modal">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: append to `value.css`**
```css
/* Wizard a pannelli */
.panel-dots { display: flex; gap: 6px; justify-content: center; margin-bottom: 12px; }
.panel-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--rule, #3a3f4a); }
.panel-dot--on { background: var(--accent, #7aa2ff); }
.panel-body { min-height: 60px; }
.panel-accept { display: flex; gap: 9px; align-items: flex-start; margin-top: 12px; font-size: 13px; cursor: pointer; }
.panel-accept input { margin-top: 2px; width: 17px; height: 17px; flex: 0 0 auto; }
.panel-nav { display: flex; gap: 10px; margin-top: 16px; }
.panel-nav .panel-next { flex: 1; }
.panel-back { background: transparent; border: 1px solid var(--rule, #3a3f4a); color: inherit; border-radius: 10px; padding: 10px 14px; cursor: pointer; }
.panel-footer { display: flex; justify-content: space-between; margin-top: 12px; }
.panel-footer-link { background: none; border: 0; color: inherit; opacity: .6; font-size: 12px; cursor: pointer; padding: 4px 2px; }
.panel-footer-link:hover { opacity: 1; }
.panel-x { position: absolute; top: 12px; right: 12px; background: none; border: 0; color: inherit; opacity: .6; cursor: pointer; font-size: 16px; }
.value-modal { position: relative; }
```

- [ ] **Step 3: static check** — add to `check-value-messaging.mjs` `checks`:
```js
{ name: 'PanelModal shell exists', pass: /value-modal-backdrop/.test(src('value/PanelModal.tsx')) },
```

- [ ] **Step 4: run** — `cd frontend && npm run test:value-messaging && npm run build`. Expect ✓ + build OK.

- [ ] **Step 5: commit**
```bash
git add frontend/src/value/PanelModal.tsx frontend/src/value/value.css frontend/scripts/check-value-messaging.mjs
git commit --no-verify -m "feat: reusable PanelModal shell + panel/wizard CSS"
```

---

## Task 3: FirstRunWizard (replaces ValueIntroModal) + login opt-out clear

**Files:** Create `frontend/src/value/FirstRunWizard.tsx`; Delete `frontend/src/value/ValueIntroModal.tsx`; Modify `frontend/src/main.tsx`; Modify `check-value-messaging.mjs`.

- [ ] **Step 1: create `FirstRunWizard.tsx`**
```tsx
import { useMemo, useState } from 'react';
import PanelModal from './PanelModal';
import AriaCapabilities from './AriaCapabilities';
import { shouldShowHourly, markShown, optOutUntilLogin } from './seen';
import { isSessionExpired, recordAcceptance } from '../auth/sessionExpiry';

const KEY = 'value-wizard';

/**
 * Wizard sequenziale al primo avvio (e a cadenza oraria). Pannelli: benvenuto →
 * come usare Aria → privacy → avviso+checkbox. L'avviso è bloccante solo se
 * l'accettazione 72h è scaduta/assente (di norma il logout 72h scatta prima, quindi
 * è informativo). Footer: «Esci per ora» (ritorna tra ~1h) / «Non mostrare più» (fino al login).
 */
export default function FirstRunWizard() {
  const eligible = useMemo(() => shouldShowHourly(KEY), []);
  const warningRequired = useMemo(() => isSessionExpired(), []);
  const [open, setOpen] = useState(eligible);
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  if (!open) return null;

  const finish = () => { markShown(KEY); if (warningRequired) recordAcceptance(); setOpen(false); };
  const exitForNow = () => { markShown(KEY); setOpen(false); };
  const optOut = () => { optOutUntilLogin(KEY); setOpen(false); };

  const panels = [
    {
      title: 'Benvenuto in Digital Trainer',
      body: (
        <p className="aria-caps-lede">
          Digital Trainer non tiene solo l'elenco dei tuoi clienti. Aria lavora sui dettagli reali di
          ognuno e ti prepara le bozze su cui lavori, in una frazione del tempo.{' '}
          <strong>Aria propone, tu decidi e personalizzi.</strong>
        </p>
      ),
    },
    { title: 'Cosa puoi fare con Aria', body: <AriaCapabilities /> },
    {
      title: 'Privacy',
      body: (
        <p className="aria-caps-lede">
          I dati dei tuoi clienti restano <strong>solo su questo dispositivo</strong>. Invii all'AI
          solo ciò che scegli; usa pseudonimi o la funzione «Anonimizza» quando opportuno.
        </p>
      ),
    },
    {
      title: 'Prima di iniziare',
      isWarning: true,
      body: (
        <p className="aria-caps-lede">
          L'intelligenza artificiale può sbagliare: <strong>controlla sempre</strong> ogni contenuto
          generato. Sei tu il professionista responsabile; per qualsiasi aspetto di salute rimanda a
          un medico qualificato. Digital Trainer è uno strumento di supporto e bozza, non fornisce
          consulenza, diagnosi o prescrizioni mediche.
        </p>
      ),
    },
  ];
  const current = panels[step];
  const last = step === panels.length - 1;
  const canAdvance = !current.isWarning || !warningRequired || accepted;

  return (
    <PanelModal labelledBy="frw-title">
      <button type="button" className="panel-x" aria-label="Esci per ora" onClick={exitForNow}>✕</button>
      <div className="panel-dots">{panels.map((_, i) => <span key={i} className={`panel-dot${i === step ? ' panel-dot--on' : ''}`} />)}</div>
      <h2 id="frw-title">{current.title}</h2>
      <div className="panel-body">{current.body}</div>
      {current.isWarning && (
        <label className="panel-accept">
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />
          <span>Ho letto e compreso: Aria prepara bozze da verificare, non decisioni.</span>
        </label>
      )}
      <div className="panel-nav">
        {step > 0 && <button type="button" className="panel-back" onClick={() => setStep(step - 1)}>Indietro</button>}
        {!last
          ? <button type="button" className="panel-next auth-tour-ok" onClick={() => setStep(step + 1)}>Avanti →</button>
          : <button type="button" className="panel-next auth-tour-ok" disabled={!canAdvance} onClick={finish}>Iniziamo</button>}
      </div>
      <div className="panel-footer">
        <button type="button" className="panel-footer-link" onClick={exitForNow}>Esci per ora</button>
        <button type="button" className="panel-footer-link" onClick={optOut}>Non mostrare più</button>
      </div>
    </PanelModal>
  );
}
```

- [ ] **Step 2: swap in `main.tsx`**
- Replace the import `import ValueIntroModal from './value/ValueIntroModal';` with `import FirstRunWizard from './value/FirstRunWizard';`.
- Replace the rendered `<ValueIntroModal />` with `<FirstRunWizard />` (same spot, before `<OnboardingWizard …/>`).
- In `AuthScreen.handleSubmit`, where `recordAcceptance()` is already called on successful login/signup, also import and call `clearLoginOptOuts`: add `clearLoginOptOuts` to the existing import from `./auth/sessionExpiry`? NO — `clearLoginOptOuts` lives in `./value/seen`. Add `import { clearLoginOptOuts } from './value/seen';` near the value imports, and call `clearLoginOptOuts();` right after each `recordAcceptance();` call (both login and signup branches).

- [ ] **Step 3: delete `ValueIntroModal.tsx`** — `git rm frontend/src/value/ValueIntroModal.tsx` (its content now lives in FirstRunWizard).

- [ ] **Step 4: update static checks** — in `check-value-messaging.mjs`, REPLACE the two checks that mention `ValueIntroModal` with:
```js
{ name: 'FirstRunWizard sequential panels + warning gate', pass: /panel-dots/.test(src('value/FirstRunWizard.tsx')) && /isSessionExpired/.test(src('value/FirstRunWizard.tsx')) && /shouldShowHourly/.test(src('value/FirstRunWizard.tsx')) },
{ name: 'FirstRunWizard mounted in main + login clears opt-outs', pass: /FirstRunWizard/.test(src('main.tsx')) && /clearLoginOptOuts/.test(src('main.tsx')) },
```

- [ ] **Step 5: run** — `cd frontend && npm run test:value-messaging && npm run test:value-cadence && npm run build`. Expect all ✓ + build OK.

- [ ] **Step 6: commit**
```bash
git add -A frontend/src/value/ frontend/src/main.tsx frontend/scripts/check-value-messaging.mjs
git commit --no-verify -m "feat: FirstRunWizard paneled first-run replaces ValueIntroModal"
```

---

## Task 4: InfoPanelModal + post-upload contextual panel

**Files:** Create `frontend/src/value/InfoPanelModal.tsx`; Modify `frontend/src/screens/CaseDetailView.tsx`; Modify `check-value-messaging.mjs`.

- [ ] **Step 1: create `InfoPanelModal.tsx`**
```tsx
import PanelModal from './PanelModal';
import { areSuggestionsEnabled, isOptedOut, optOutUntilLogin } from './seen';
import { type ReactNode } from 'react';

/**
 * Pannello contestuale singolo. Appare a ogni trigger (nessun timer) finché non
 * è in opt-out e i suggerimenti sono ON. Exit (× / «Ho capito») chiude solo questa
 * volta; «Non mostrare più» opt-out fino al prossimo login.
 */
export default function InfoPanelModal({ id, title, children, onClose }: { id: string; title: string; children: ReactNode; onClose: () => void }) {
  if (!areSuggestionsEnabled() || isOptedOut(`ctx:${id}`)) return null;
  const optOut = () => { optOutUntilLogin(`ctx:${id}`); onClose(); };
  return (
    <PanelModal labelledBy={`ip-${id}`}>
      <button type="button" className="panel-x" aria-label="Chiudi" onClick={onClose}>✕</button>
      <h2 id={`ip-${id}`}>{title}</h2>
      <div className="panel-body">{children}</div>
      <div className="panel-nav">
        <button type="button" className="panel-next auth-tour-ok" onClick={onClose}>Ho capito</button>
      </div>
      <div className="panel-footer">
        <span />
        <button type="button" className="panel-footer-link" onClick={optOut}>Non mostrare più</button>
      </div>
    </PanelModal>
  );
}
```

- [ ] **Step 2: wire post-upload panel in `CaseDetailView.tsx`**
- Add import: `import InfoPanelModal from '../value/InfoPanelModal';`.
- Add state near the other `useState` in the main component: `const [showPostUpload, setShowPostUpload] = useState(false);`.
- In the `MultiFileUploadDrawer` `onClose` (around line 2881, currently `() => { setUploadQueue(prev => prev.filter(i => i.status !== 'done')); setShowUpload(false); wizardBus.emit('upload-closed'); }`), set the panel when material was added — change it to:
```tsx
onClose={() => {
  const addedMaterial = uploadQueue.some(i => i.status === 'done');
  setUploadQueue(prev => prev.filter(i => i.status !== 'done'));
  setShowUpload(false);
  wizardBus.emit('upload-closed');
  if (addedMaterial) setShowPostUpload(true);
}}
```
- Near the other modals at the end of the returned JSX (next to `<AiInstructionsModal … />`), render:
```tsx
{showPostUpload && (
  <InfoPanelModal id="post-upload" title="Ecco cosa succede ora" onClose={() => setShowPostUpload(false)}>
    <p className="aria-caps-lede">
      Qui comincia la magia. Quando avvii l'analisi, Aria legge il materiale che hai aggiunto e
      prepara le bozze — piano, report, messaggio al cliente — sui dati reali della scheda.
      Tu rifinisci e consegni.
    </p>
  </InfoPanelModal>
)}
```

- [ ] **Step 3: static check** — add to `check-value-messaging.mjs`:
```js
{ name: 'InfoPanelModal + post-upload wired', pass: /isOptedOut/.test(src('value/InfoPanelModal.tsx')) && /InfoPanelModal/.test(src('screens/CaseDetailView.tsx')) && /post-upload/.test(src('screens/CaseDetailView.tsx')) },
```

- [ ] **Step 4: run** — `cd frontend && npm run test:value-messaging && npm run build`. Expect ✓ + build OK.

- [ ] **Step 5: commit**
```bash
git add frontend/src/value/InfoPanelModal.tsx frontend/src/screens/CaseDetailView.tsx frontend/scripts/check-value-messaging.mjs
git commit --no-verify -m "feat: contextual InfoPanelModal + post-upload 'comincia la magia' panel"
```

---

## Task 5: «Logout» button on the PIN LockScreen

**Files:** Modify `frontend/src/lock/LockScreen.tsx`; Modify `frontend/src/lock/LockGate.tsx`; Modify `check-value-messaging.mjs`.

- [ ] **Step 1: LockGate passes onLogout**
In `frontend/src/lock/LockGate.tsx`, at the line that renders `<LockScreen userId={userId} onForgot={handleForgot} />`, add an `onLogout` prop:
```tsx
<LockScreen userId={userId} onForgot={handleForgot} onLogout={() => { void supabase.auth.signOut(); }} />
```
(`supabase` is already imported in LockGate — it's used by `handleForgot`. If not, import it from `../supabaseClient`.)

- [ ] **Step 2: LockScreen renders the button**
In `frontend/src/lock/LockScreen.tsx`:
- Change the signature to accept the new prop: `export default function LockScreen({ userId, onForgot, onLogout }: { userId: string; onForgot: () => void; onLogout: () => void }) {`
- Next to the existing `<button … className="lock-forgot" onClick={onForgot}>PIN dimenticato?</button>`, add:
```tsx
<button type="button" className="lock-forgot" onClick={onLogout}>Logout</button>
```

- [ ] **Step 3: static check** — add to `check-value-messaging.mjs`:
```js
{ name: 'PIN screen has a Logout escape', pass: /onLogout/.test(src('lock/LockScreen.tsx')) && /Logout/.test(src('lock/LockScreen.tsx')) && /onLogout/.test(src('lock/LockGate.tsx')) },
```

- [ ] **Step 4: run** — `cd frontend && npm run test:value-messaging && npm run test:app-lock && npm run build`. Expect ✓ + build OK.

- [ ] **Step 5: commit**
```bash
git add frontend/src/lock/LockScreen.tsx frontend/src/lock/LockGate.tsx frontend/scripts/check-value-messaging.mjs
git commit --no-verify -m "feat: Logout escape button on the PIN lock screen"
```

---

## Task 6: docs + final verification

**Files:** Modify `README.md`, `CURRENT-TASK.md`, `docs/port-login-to-plt.md`.

- [ ] **Step 1: docs**
- `README.md` codebase tree: add `PanelModal.tsx`, `FirstRunWizard.tsx` (sostituisce ValueIntroModal), `InfoPanelModal.tsx` under `value/`; add `npm run test:value-cadence` to the verification commands.
- `CURRENT-TASK.md`: update the value-messaging DONE entry to note the rev-2 panel system (wizard, contextual panels, cadenza oraria + opt-out fino al login, Logout su PIN).
- `docs/port-login-to-plt.md` §11: note the rev-2 additions to port (FirstRunWizard, InfoPanelModal, cadence helpers, PIN Logout).

- [ ] **Step 2: full verification**
```bash
cd frontend && npm run build && npm run test:value-messaging && npm run test:value-cadence && npm run test:auth-onboarding && npm run test:app-lock && npm run test:session-expiry
```
Expect build OK + all ✓.

- [ ] **Step 3: git diff --check** then commit
```bash
git diff --check
git add README.md CURRENT-TASK.md docs/port-login-to-plt.md
git commit --no-verify -m "docs: record value panels rev-2 (wizard, contextual panels, PIN logout)"
```

- [ ] **Step 4: QA live (lato Deckard)** — Netlify dopo deploy: primo avvio = wizard a pannelli (pallini, Avanti/Indietro, avviso+checkbox); riapparizione dopo 1h; «Esci per ora» / «Non mostrare più»; pannello post-upload «comincia la magia»; bottone Logout sulla pagina PIN.

---

## Note
- I check `.mjs` statici scansionano stringhe: se cambi wording, aggiorna l'assertion nello stesso commit.
- Nessun cambiamento backend.
- Mobile-first: i pannelli devono restare leggibili sotto 880px (verifica live).
- L'avviso-gate è di norma informativo perché il logout 72h scatta prima all'avvio app; resta bloccante solo nell'edge case di accettazione stale con sessione ancora valida.