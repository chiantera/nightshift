# Digital Trainer — Value Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Far capire a chi apre Digital Trainer cosa fa l'app e perché è diversa (Aria + personalizzazione profonda), su login, in-app e copy d'invito, senza suonare gonfio.

**Architecture:** Riscrittura di copy esistente (login `auth-intro` + `AuthTour`, step del tour, invito) + 3 piccoli componenti nuovi che riusano il pattern localStorage "una-tantum" già presente (modale valore al primo avvio, hint contestuali, pannello «Cosa fa Aria»). Nessuna nuova route, nessun cambiamento di logica AI/backend. Mobile-first.

**Tech Stack:** React 19 + Vite + TypeScript; lucide-react per le icone; localStorage per "già visto"; test = script statici `.mjs` in `frontend/scripts/` (stile esistente) + `npm run build`.

**Spec di riferimento:** `docs/superpowers/specs/2026-06-03-digital-trainer-value-messaging-design.md`
**Play Store:** copy già avviato in `06-brand/play-store-testing-copy.md` (file separato, fuori da questo piano).

**Regole di voce (valgono per ogni task con testo):** niente «rivoluziona / il futuro del / potenzia al massimo»; frasi brevi e concrete; sempre «Aria propone, tu decidi e personalizzi»; nota nutrizionale = orientativa, rimanda al nutrizionista.

---

## File Structure

- `frontend/src/main.tsx` — login (`AuthScreen` ~330-425, `AuthTour` ~300-328); mount del modale valore nell'app autenticata (~531-540).
- `frontend/src/onboarding/OnboardingWizard.tsx` — copy degli STEP.
- `frontend/src/value/ValueIntroModal.tsx` — **nuovo**: modale valore una-tantum al primo avvio.
- `frontend/src/value/ContextualHint.tsx` — **nuovo**: hint inline dismissibile, "già visto" persistito.
- `frontend/src/value/seen.ts` — **nuovo**: helper localStorage `isSeen(key)` / `markSeen(key)`.
- `frontend/src/value/AriaCapabilities.tsx` — **nuovo**: contenuto «Cosa fa Aria» (riusato da modale + pannello Profilo).
- `frontend/src/components/AccountControls.tsx` — aggiunta voce «Cosa fa Aria» nel drawer Profilo.
- `frontend/src/value/value.css` — **nuovo**: stile dei componenti valore (importato da main.tsx).
- `05-validation/tester-outreach.md` — copy d'invito.
- `frontend/scripts/check-value-messaging.mjs` — **nuovo**: assertion statiche.
- `frontend/scripts/check-auth-onboarding.mjs` — aggiornato per la nuova copy login.
- `frontend/package.json` — aggiunge `test:value-messaging`.

---

## Task 1: helper "seen" per il pattern una-tantum

**Files:**
- Create: `frontend/src/value/seen.ts`
- Test: `frontend/scripts/check-value-messaging.mjs`

- [ ] **Step 1: Scrivi il test (fallisce)**

Crea `frontend/scripts/check-value-messaging.mjs`:

```js
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = (rel) => existsSync(join(__dirname, '..', 'src', rel)) ? readFileSync(join(__dirname, '..', 'src', rel), 'utf8') : '';

const checks = [
  { name: 'seen helper exists with isSeen/markSeen', pass: /export function isSeen/.test(src('value/seen.ts')) && /export function markSeen/.test(src('value/seen.ts')) },
  { name: 'global suggestions toggle helpers exist', pass: /export function areSuggestionsEnabled/.test(src('value/seen.ts')) && /export function setSuggestionsEnabled/.test(src('value/seen.ts')) },
];

const failed = checks.filter(c => !c.pass);
for (const c of checks) console.log(`${c.pass ? '✓' : '✗'} ${c.name}`);
if (failed.length) { console.error(`\n${failed.length} value-messaging check(s) failed.`); process.exit(1); }
```

- [ ] **Step 2: Aggiungi lo script a package.json**

In `frontend/package.json` scripts, dopo `"test:app-lock": ...`, aggiungi:

```json
"test:value-messaging": "node scripts/check-value-messaging.mjs"
```

- [ ] **Step 3: Esegui il test (fallisce)**

Run: `cd frontend && npm run test:value-messaging`
Atteso: FAIL su "seen helper exists".

- [ ] **Step 4: Implementa `seen.ts`**

```ts
// One-time "già visto" flags for value-messaging UI (modal, hints).
// Same localStorage convention used by the onboarding wizard / auth tour.
export function isSeen(key: string): boolean {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}

export function markSeen(key: string): void {
  try { localStorage.setItem(key, '1'); } catch { /* noop */ }
}

// Global on/off for ALL in-app suggestions (value modal + contextual hints + tour).
// Default ON. Does NOT affect the login page. Off is stored as '0'.
const SUGGESTIONS_KEY = 'spr:suggestions-enabled';

export function areSuggestionsEnabled(): boolean {
  try { return localStorage.getItem(SUGGESTIONS_KEY) !== '0'; } catch { return true; }
}

export function setSuggestionsEnabled(enabled: boolean): void {
  try { localStorage.setItem(SUGGESTIONS_KEY, enabled ? '1' : '0'); } catch { /* noop */ }
}
```

- [ ] **Step 5: Esegui il test (passa)**

Run: `cd frontend && npm run test:value-messaging`
Atteso: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/value/seen.ts frontend/scripts/check-value-messaging.mjs frontend/package.json
git commit -m "feat: seen-flag helper + value-messaging check harness"
```

---

## Task 2: contenuto condiviso «Cosa fa Aria» (AriaCapabilities)

**Files:**
- Create: `frontend/src/value/AriaCapabilities.tsx`
- Test: `frontend/scripts/check-value-messaging.mjs` (estendi)

- [ ] **Step 1: Estendi il test (fallisce)**

In `check-value-messaging.mjs`, aggiungi al array `checks`:

```js
{ name: 'AriaCapabilities lists the 4 proof-points', pass: /conosce già la scheda/.test(src('value/AriaCapabilities.tsx')) && /istruzioni aggiuntive/i.test(src('value/AriaCapabilities.tsx')) && /a voce/.test(src('value/AriaCapabilities.tsx')) && /condizioni/.test(src('value/AriaCapabilities.tsx')) },
{ name: 'AriaCapabilities positioning line present', pass: /non tiene solo l'elenco/i.test(src('value/AriaCapabilities.tsx')) },
{ name: 'AriaCapabilities keeps trainer in control', pass: /tu (decidi|verifichi)/i.test(src('value/AriaCapabilities.tsx')) },
```

- [ ] **Step 2: Esegui (fallisce)**

Run: `cd frontend && npm run test:value-messaging`
Atteso: FAIL sui 3 nuovi check.

- [ ] **Step 3: Implementa `AriaCapabilities.tsx`**

```tsx
import { MessageSquare, SlidersHorizontal, Mic, HeartPulse } from 'lucide-react';

/** Riepilogo del valore di Aria. Riusato dal modale valore e dal pannello Profilo. */
export default function AriaCapabilities() {
  return (
    <div className="aria-caps">
      <p className="aria-caps-lede">
        Digital Trainer non tiene solo l'elenco dei tuoi clienti. Aria lavora sui dettagli reali di
        ognuno — condizioni, progressi, obiettivi — e ti prepara le bozze su cui lavori, in una
        frazione del tempo. <strong>Aria propone, tu decidi e personalizzi.</strong>
      </p>
      <ul className="aria-caps-list">
        <li><MessageSquare size={18} /><div><strong>Chiedile qualsiasi cosa su un cliente</strong><span>Dalla chat: conosce già la scheda e risponde all'istante con consigli e dubbi.</span></div></li>
        <li><SlidersHorizontal size={18} /><div><strong>Istruzioni aggiuntive</strong><span>Prima di un'analisi dici ad Aria cosa guardare: orienti il risultato prima di generarlo.</span></div></li>
        <li><Mic size={18} /><div><strong>Detta a voce in palestra</strong><span>Registri la sessione parlando: Aria la struttura nella scheda.</span></div></li>
        <li><HeartPulse size={18} /><div><strong>Si adatta al cliente reale</strong><span>Tiene conto di condizioni e limiti; per dieta e salute rimanda al medico/nutrizionista.</span></div></li>
      </ul>
      <p className="aria-caps-foot">
        Da questi dati Aria bozza piano settimanale, scheda mensile, report progresso, nota
        nutrizionale orientativa e messaggio al cliente — sui dati reali della scheda, mai inventati.
        Tu verifichi e consegni.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Esegui (passa)**

Run: `cd frontend && npm run test:value-messaging`
Atteso: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/value/AriaCapabilities.tsx frontend/scripts/check-value-messaging.mjs
git commit -m "feat: shared AriaCapabilities value content"
```

---

## Task 3: stile dei componenti valore

**Files:**
- Create: `frontend/src/value/value.css`
- Modify: `frontend/src/main.tsx` (aggiungi import del css vicino agli altri import css)

- [ ] **Step 1: Implementa `value.css`**

```css
.aria-caps-lede { font-size: 15px; line-height: 1.5; margin: 0 0 14px; }
.aria-caps-list { list-style: none; margin: 0 0 14px; padding: 0; display: grid; gap: 12px; }
.aria-caps-list li { display: flex; gap: 10px; align-items: flex-start; }
.aria-caps-list li svg { flex: 0 0 auto; margin-top: 2px; opacity: .9; }
.aria-caps-list strong { display: block; font-size: 14px; }
.aria-caps-list span { font-size: 13px; opacity: .82; }
.aria-caps-foot { font-size: 13px; opacity: .82; margin: 0; }

/* Modale valore (riusa il backdrop scuro del tour) */
.value-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; }
.value-modal { background: var(--surface, #15171c); color: var(--text, #e9edf2); border-radius: 16px; max-width: 480px; width: 100%; max-height: 86vh; overflow-y: auto; padding: 22px; box-shadow: 0 12px 40px rgba(0,0,0,.5); }
.value-modal h2 { margin: 0 0 4px; font-size: 19px; }
.value-modal .value-modal-kicker { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; opacity: .6; margin-bottom: 10px; }
.value-modal-ok { margin-top: 16px; width: 100%; }

/* Hint contestuale inline */
.ctx-hint { display: flex; gap: 8px; align-items: flex-start; background: rgba(120,160,255,.10); border: 1px solid rgba(120,160,255,.28); border-radius: 12px; padding: 10px 12px; font-size: 13px; line-height: 1.4; margin: 8px 0; }
.ctx-hint svg { flex: 0 0 auto; margin-top: 1px; opacity: .9; }
.ctx-hint-x { margin-left: auto; background: none; border: 0; color: inherit; opacity: .6; cursor: pointer; font-size: 15px; line-height: 1; padding: 0 2px; }
.ctx-hint-x:hover { opacity: 1; }
```

- [ ] **Step 2: Importa il css in main.tsx**

In `frontend/src/main.tsx`, vicino agli altri import css (es. dopo `import './lock/lock.css';`), aggiungi:

```ts
import './value/value.css';
```

- [ ] **Step 3: Verifica build**

Run: `cd frontend && npm run build`
Atteso: build OK (nessun errore TS/CSS).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/value/value.css frontend/src/main.tsx
git commit -m "feat: value-messaging styles"
```

---

## Task 4: ContextualHint (componente hint una-tantum)

**Files:**
- Create: `frontend/src/value/ContextualHint.tsx`
- Test: `frontend/scripts/check-value-messaging.mjs` (estendi)

- [ ] **Step 1: Estendi il test (fallisce)**

Aggiungi a `checks`:

```js
{ name: 'ContextualHint uses seen helper and is dismissible', pass: /isSeen/.test(src('value/ContextualHint.tsx')) && /markSeen/.test(src('value/ContextualHint.tsx')) && /ctx-hint-x/.test(src('value/ContextualHint.tsx')) },
```

- [ ] **Step 2: Esegui (fallisce)**

Run: `cd frontend && npm run test:value-messaging`
Atteso: FAIL sul nuovo check.

- [ ] **Step 3: Implementa `ContextualHint.tsx`**

```tsx
import { useState, type ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import { isSeen, markSeen, areSuggestionsEnabled } from './seen';

/**
 * Hint inline non bloccante, mostrato una sola volta per `id`.
 * Si autodistrugge dopo il dismiss e non riappare (localStorage).
 * Rispetta l'interruttore globale dei suggerimenti (Profilo).
 */
export default function ContextualHint({ id, children }: { id: string; children: ReactNode }) {
  const storageKey = `spr:hint:${id}`;
  const [show, setShow] = useState(() => areSuggestionsEnabled() && !isSeen(storageKey));
  if (!show) return null;
  const close = () => { markSeen(storageKey); setShow(false); };
  return (
    <div className="ctx-hint" role="note">
      <Lightbulb size={16} />
      <div>{children}</div>
      <button type="button" className="ctx-hint-x" aria-label="Ho capito" onClick={close}>✕</button>
    </div>
  );
}
```

- [ ] **Step 4: Esegui (passa)**

Run: `cd frontend && npm run test:value-messaging`
Atteso: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/value/ContextualHint.tsx frontend/scripts/check-value-messaging.mjs
git commit -m "feat: ContextualHint one-time dismissible hint"
```

---

## Task 5: ValueIntroModal (modale valore al primo avvio) + mount

**Files:**
- Create: `frontend/src/value/ValueIntroModal.tsx`
- Modify: `frontend/src/main.tsx` (mount nell'app autenticata, vicino a `<OnboardingWizard />`)
- Test: `frontend/scripts/check-value-messaging.mjs` (estendi)

- [ ] **Step 1: Estendi il test (fallisce)**

Aggiungi a `checks`:

```js
{ name: 'ValueIntroModal shown once via seen flag before the tour', pass: /spr:value-intro-seen/.test(src('value/ValueIntroModal.tsx')) && /AriaCapabilities/.test(src('value/ValueIntroModal.tsx')) },
{ name: 'ValueIntroModal mounted in main', pass: /ValueIntroModal/.test(src('main.tsx')) },
```

- [ ] **Step 2: Esegui (fallisce)**

Run: `cd frontend && npm run test:value-messaging`
Atteso: FAIL sui 2 nuovi check.

- [ ] **Step 3: Implementa `ValueIntroModal.tsx`**

```tsx
import { useState } from 'react';
import AriaCapabilities from './AriaCapabilities';
import { isSeen, markSeen, areSuggestionsEnabled } from './seen';

const KEY = 'spr:value-intro-seen';

/**
 * Modale valore mostrato UNA sola volta al primo avvio autenticato, prima del
 * tour funzionale (il "perché" prima del "come"). Dopo il dismiss non riappare.
 * Rispetta l'interruttore globale dei suggerimenti (Profilo).
 */
export default function ValueIntroModal() {
  const [show, setShow] = useState(() => areSuggestionsEnabled() && !isSeen(KEY));
  if (!show) return null;
  const close = () => { markSeen(KEY); setShow(false); };
  return (
    <div className="value-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="value-modal-title">
      <div className="value-modal">
        <div className="value-modal-kicker">Benvenuto in Digital Trainer</div>
        <h2 id="value-modal-title">Ecco cosa puoi fare con Aria</h2>
        <AriaCapabilities />
        <button type="button" className="auth-tour-ok value-modal-ok" onClick={close}>Iniziamo</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Monta il modale in main.tsx**

In `frontend/src/main.tsx`: aggiungi l'import vicino a `import OnboardingWizard from './onboarding/OnboardingWizard';`:

```ts
import ValueIntroModal from './value/ValueIntroModal';
```

Poi, dove è renderizzato `<OnboardingWizard ... />` nell'app autenticata, aggiungi **subito prima**:

```tsx
<ValueIntroModal />
```

(Il modale gestisce da sé il "già visto"; comparendo sopra il tour, il tester legge prima il valore e poi parte il tour.)

- [ ] **Step 5: Esegui test + build**

Run: `cd frontend && npm run test:value-messaging && npm run build`
Atteso: PASS + build OK.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/value/ValueIntroModal.tsx frontend/src/main.tsx frontend/scripts/check-value-messaging.mjs
git commit -m "feat: one-time value intro modal before the onboarding tour"
```

---

## Task 6: hint contestuali ai 3 momenti-chiave

**Files:**
- Modify: `frontend/src/main.tsx` (FAB / AriaPromptBar zone)
- Modify: `frontend/src/components/AiInstructionsModal.tsx` (campo istruzioni aggiuntive)
- Modify: `frontend/src/screens/CaseDetailView.tsx` (zona bozze dopo analisi)
- Test: `frontend/scripts/check-value-messaging.mjs` (estendi)

> Nota implementazione: importa `ContextualHint` in ciascun file e inserisci l'hint vicino all'elemento. Usa id stabili: `aria-fab`, `istruzioni`, `bozze`.

- [ ] **Step 1: Estendi il test (fallisce)**

Aggiungi a `checks`:

```js
{ name: 'contextual hints wired at the 3 key moments', pass:
    /ContextualHint/.test(src('main.tsx')) &&
    /ContextualHint/.test(src('components/AiInstructionsModal.tsx')) &&
    /ContextualHint/.test(src('screens/CaseDetailView.tsx')) },
```

- [ ] **Step 2: Esegui (fallisce)**

Run: `cd frontend && npm run test:value-messaging`
Atteso: FAIL sul nuovo check.

- [ ] **Step 3a: Hint sul FAB di Aria (main.tsx)**

Importa in cima a `frontend/src/main.tsx`:

```ts
import ContextualHint from './value/ContextualHint';
```

Subito sopra `<AriaPromptBar onOpenChat={onOpenChat} />` (riga ~540), inserisci:

```tsx
<ContextualHint id="aria-fab">Chiedi ad <strong>Aria</strong> qualsiasi cosa su questo cliente: conosce già la scheda e risponde all'istante.</ContextualHint>
```

- [ ] **Step 3b: Hint sul campo istruzioni aggiuntive (AiInstructionsModal.tsx)**

Importa `ContextualHint` (`import ContextualHint from '../value/ContextualHint';`). Sopra la textarea delle istruzioni, inserisci:

```tsx
<ContextualHint id="istruzioni">Scrivi qui cosa vuoi che <strong>Aria</strong> guardi: orienti l'analisi prima ancora di generarla.</ContextualHint>
```

- [ ] **Step 3c: Hint sulle bozze (CaseDetailView.tsx)**

Importa `ContextualHint` (`import ContextualHint from '../value/ContextualHint';`). Nella sezione dove compaiono le bozze/azioni Aria dopo l'analisi, inserisci:

```tsx
<ContextualHint id="bozze">Queste sono <strong>bozze pronte da rifinire</strong> — piano, report, messaggio al cliente. Tu verifichi e consegni.</ContextualHint>
```

- [ ] **Step 4: Esegui test + build**

Run: `cd frontend && npm run test:value-messaging && npm run build`
Atteso: PASS + build OK.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/main.tsx frontend/src/components/AiInstructionsModal.tsx frontend/src/screens/CaseDetailView.tsx frontend/scripts/check-value-messaging.mjs
git commit -m "feat: contextual value hints at FAB / istruzioni / bozze"
```

---

## Task 7: voce «Cosa fa Aria» nel drawer Profilo

**Files:**
- Modify: `frontend/src/components/AccountControls.tsx`
- Test: `frontend/scripts/check-value-messaging.mjs` (estendi)

- [ ] **Step 1: Estendi il test (fallisce)**

Aggiungi a `checks`:

```js
{ name: 'Profilo drawer exposes "Cosa fa Aria"', pass: /Cosa fa Aria/.test(src('components/AccountControls.tsx')) && /AriaCapabilities/.test(src('components/AccountControls.tsx')) },
{ name: 'Profilo drawer has a global suggestions toggle', pass: /setSuggestionsEnabled/.test(src('components/AccountControls.tsx')) && /suggeriment/i.test(src('components/AccountControls.tsx')) },
```

- [ ] **Step 2: Esegui (fallisce)**

Run: `cd frontend && npm run test:value-messaging`
Atteso: FAIL sui 2 nuovi check.

- [ ] **Step 3: Aggiungi la sezione «Cosa fa Aria» nel drawer Profilo**

In `frontend/src/components/AccountControls.tsx`:
- importa `AriaCapabilities` (`import AriaCapabilities from '../value/AriaCapabilities';`) e `useState` se non presente;
- dentro il `profile-drawer` (vicino alle altre sezioni, prima del logout), aggiungi un blocco collassabile:

```tsx
<details className="profile-section">
  <summary className="lock-manage-btn">Cosa fa Aria</summary>
  <div style={{ marginTop: 10 }}><AriaCapabilities /></div>
</details>
```

- [ ] **Step 4: Aggiungi l'interruttore globale dei suggerimenti**

Sempre in `AccountControls.tsx`:
- importa anche `areSuggestionsEnabled, setSuggestionsEnabled` da `'../value/seen'` e `dismissOnboarding` da `'../onboarding/wizardBus'`;
- aggiungi uno stato locale e una riga toggle nel drawer (sotto «Cosa fa Aria»):

```tsx
const [suggestions, setSuggestions] = useState(() => areSuggestionsEnabled());
// …
<label className="profile-section profile-toggle">
  <span>Mostra suggerimenti e spiegazioni in-app</span>
  <input
    type="checkbox"
    checked={suggestions}
    onChange={e => {
      const on = e.target.checked;
      setSuggestions(on);
      setSuggestionsEnabled(on);
      if (!on) dismissOnboarding(); // spegne anche il tour spotlight
    }}
  />
</label>
<p className="profile-hint">Spegne il modale di benvenuto, gli aiuti contestuali e il tour. Non tocca gli avvisi della pagina di accesso.</p>
```

> Nota: il toggle agisce sulle prossime apparizioni. Hint/modale già chiusi restano chiusi; riattivandolo, ricompariranno solo quelli non ancora "visti".

- [ ] **Step 5: Esegui test + build**

Run: `cd frontend && npm run test:value-messaging && npm run build`
Atteso: PASS + build OK.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/AccountControls.tsx frontend/scripts/check-value-messaging.mjs
git commit -m "feat: 'Cosa fa Aria' + global in-app suggestions toggle in profile"
```

---

## Task 8: riscrittura copy login (auth-intro + AuthTour)

**Files:**
- Modify: `frontend/src/main.tsx` (`AuthScreen` ~398-421, `AuthTour` ~313-320)
- Modify: `frontend/scripts/check-auth-onboarding.mjs` (allinea le assertion alla nuova copy)

- [ ] **Step 1: Aggiorna le assertion (fallisce con la copy attuale)**

In `frontend/scripts/check-auth-onboarding.mjs` sostituisci le prime due `checks`:

```js
{ name: 'auth headline leads with the Aria differentiator, not generic', pass: src.includes('Non l\'ennesimo gestionale') || src.includes('non tiene solo l\'elenco') },
{ name: 'auth screen keeps trainer in control', pass: src.includes('Aria prepara le bozze, tu verifichi e consegni') },
```

- [ ] **Step 2: Esegui (fallisce)**

Run: `cd frontend && npm run test:auth-onboarding`
Atteso: FAIL su "auth headline leads with the Aria differentiator".

- [ ] **Step 3: Riscrivi headline + lede in `auth-intro`**

In `frontend/src/main.tsx` sostituisci l'`<h1 id="auth-title">` e il `<p className="auth-lede">` con:

```tsx
<h1 id="auth-title">Non l'ennesimo gestionale clienti. È Aria che lavora coi dettagli reali di ognuno.</h1>
<p className="auth-lede">
  Aria conosce ogni cliente — condizioni, progressi, obiettivi — e ti prepara piani, report e
  messaggi su misura, in una frazione del tempo. Tu resti il professionista al comando:
  Aria prepara le bozze, tu verifichi e consegni.
</p>
```

- [ ] **Step 4: Riordina la feature-list sui 4 proof-point**

Sostituisci i primi 4 `<li>` di `.auth-feature-list` (mantieni gli altri sotto) con, in quest'ordine:

```tsx
<li><MessageSquare size={18} /><div><strong>Chiedi ad Aria qualsiasi cosa</strong><span>Una chat che conosce già la scheda: consigli e dubbi sul cliente, all'istante.</span></div></li>
<li><CheckSquare size={18} /><div><strong>Bozze pronte da rifinire</strong><span>Piano settimanale e mensile, report progresso, messaggio al cliente — sui suoi dati reali.</span></div></li>
<li><Mic size={18} /><div><strong>Detta a voce in palestra</strong><span>Registri la sessione parlando: Aria la struttura nella scheda.</span></div></li>
<li><ShieldCheck size={18} /><div><strong>Si adatta al cliente reale</strong><span>Tiene conto di condizioni e limiti; per dieta e salute rimanda al medico.</span></div></li>
```

> Verifica che le icone usate (`MessageSquare`, `CheckSquare`, `Mic`, `ShieldCheck`) siano già importate in `main.tsx` — lo sono nella feature-list attuale.

- [ ] **Step 5: Aggiorna la copy dell'AuthTour**

In `AuthTour`, sostituisci `<p className="tour-body">` e mantieni i 3 step legali ma aggiungi una riga di valore in cima:

```tsx
<p className="tour-body">Digital Trainer ti fa gestire i clienti con <strong>Aria</strong>, che prepara bozze su misura sui dati reali di ognuno. Prima di entrare, tre passaggi rapidi:</p>
```

- [ ] **Step 6: Esegui test + build**

Run: `cd frontend && npm run test:auth-onboarding && npm run test:value-messaging && npm run build`
Atteso: PASS + build OK.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/main.tsx frontend/scripts/check-auth-onboarding.mjs
git commit -m "feat: login copy leads with the Aria differentiator"
```

---

## Task 9: arricchimento copy del tour funzionale

**Files:**
- Modify: `frontend/src/onboarding/OnboardingWizard.tsx` (campi `body` degli STEP)
- Test: `frontend/scripts/check-value-messaging.mjs` (estendi)

- [ ] **Step 1: Estendi il test (fallisce)**

Aggiungi a `checks`:

```js
{ name: 'tour step explains the why (Aria prepares drafts)', pass: /Aria (legge|prepara)/.test(src('onboarding/OnboardingWizard.tsx')) },
```

- [ ] **Step 2: Esegui (fallisce)**

Run: `cd frontend && npm run test:value-messaging`
Atteso: FAIL sul nuovo check.

- [ ] **Step 3: Riscrivi i `body` per spiegare il perché**

In `frontend/src/onboarding/OnboardingWizard.tsx`, aggiorna i `body` degli step così (mantieni `id`/`selector`/`advanceOn`):
- step `add-doc`: `body: 'Aggiungi appunti, una nota vocale, un documento o una foto. Più materiale dai, più Aria personalizza: condizioni, progressi e obiettivi del cliente.'`
- step `analyze` (lo step finale che avvia l'analisi): `body: 'Qui Aria legge i dati della scheda e prepara le bozze — piano, report, messaggio al cliente — pronte da rifinire. Prima di avviare puoi darle istruzioni aggiuntive su cosa guardare.'`

- [ ] **Step 4: Esegui test + build**

Run: `cd frontend && npm run test:value-messaging && npm run build`
Atteso: PASS + build OK.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/onboarding/OnboardingWizard.tsx frontend/scripts/check-value-messaging.mjs
git commit -m "feat: tour steps explain the why, not just the how"
```

---

## Task 10: copy d'invito (tester)

**Files:**
- Modify: `05-validation/tester-outreach.md`

- [ ] **Step 1: Riscrivi la versione WhatsApp completa**

Sostituisci il blocco "Versione WhatsApp (completa)" con un testo che guida col differenziatore:

```markdown
## Versione WhatsApp (completa)

> Ciao [Nome]! 👋 Ho messo su **Digital Trainer**, un'app (in prova) per gestire i clienti in palestra — ma la cosa diversa è **Aria**, un'assistente AI che lavora sui dettagli reali di ogni cliente.
>
> In pratica: le chiedi qualsiasi cosa su un cliente dalla chat (conosce già la scheda), detti le sessioni a voce, e lei ti prepara piani, report progresso e messaggi su misura — tu controlli e consegni. I dati restano solo sul tuo telefono.
>
> È un alpha e il tuo parere mi serve davvero. La provi qui 👉 **digitaltrainer.netlify.app**
>
> _(Al primo accesso: leggi l'avviso, spunta la casella e registrati con un'email. La primissima apertura può metterci ~30-40 secondi a "svegliarsi", poi va liscia.)_
>
> Fammi sapere che ne pensi! 💪
```

- [ ] **Step 2: Riscrivi la versione WhatsApp secca**

```markdown
## Versione WhatsApp (secca)

> Ciao [Nome]! Ho fatto **Digital Trainer**, app per gestire i clienti in palestra con un'assistente AI, **Aria**: le chiedi consigli su un cliente, detti le sessioni a voce e ti prepara piani/report su misura — tu verifichi e consegni. È in prova, mi serve il tuo parere 👉 digitaltrainer.netlify.app (al primo accesso leggi l'avviso, spunta e registrati; la prima apertura ~30 sec). Dimmi che ne pensi! 💪
```

- [ ] **Step 3: Commit**

```bash
git add 05-validation/tester-outreach.md
git commit -m "docs: invite copy leads with the Aria differentiator"
```

---

## Task 11: documentazione + verifica finale

**Files:**
- Modify: `frontend/package.json` (già fatto in Task 1 — verifica presenza `test:value-messaging`)
- Modify: `README.md` e/o `alpha-pwa`-equivalente se elenca le feature/test; `CURRENT-TASK.md`

- [ ] **Step 1: Aggiorna README + CURRENT-TASK**

- In `README.md`: aggiungi `value/` all'albero del codebase (modale valore, hint contestuali, «Cosa fa Aria») e `npm run test:value-messaging` ai comandi di verifica.
- In `CURRENT-TASK.md`: marca il workstream "comunicare il valore" come fatto, con i commit, e lascia in backlog le voci residue (login biometrico, reclutamento 12 tester Play Store).

- [ ] **Step 2: Verifica completa**

```bash
cd frontend && npm run build && npm run test:auth-onboarding && npm run test:value-messaging && npm run test:draft-workspace-ui
```
Atteso: build OK + tutti i check PASS.

- [ ] **Step 3: git diff --check**

Run: `git diff --check`
Atteso: nessun whitespace error.

- [ ] **Step 4: Commit + push**

```bash
git add README.md CURRENT-TASK.md
git commit -m "docs: record value-messaging workstream + value/ module"
git push origin main
```

- [ ] **Step 5: QA live (manuale, lato Deckard)**

Su `digitaltrainer.netlify.app` dopo il deploy: verifica login (headline differenziata), primo avvio (modale valore → tour), hint contestuali ai 3 punti, e «Cosa fa Aria» nel Profilo. (Localhost non raggiungibile da remoto.)

---

## Note di esecuzione
- I check `.mjs` sono scansioni statiche di stringhe (stile esistente del repo): se cambi il wording, aggiorna l'assertion nello stesso commit.
- Nessun cambiamento backend/AI: non servono i test pytest del backend.
- Mobile-first: i nuovi componenti devono restare leggibili sotto 880px (verifica live su Netlify).
