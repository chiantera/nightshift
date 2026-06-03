import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = (rel) => existsSync(join(__dirname, '..', 'src', rel)) ? readFileSync(join(__dirname, '..', 'src', rel), 'utf8') : '';

const checks = [
  { name: 'seen helper exists with isSeen/markSeen', pass: /export function isSeen/.test(src('value/seen.ts')) && /export function markSeen/.test(src('value/seen.ts')) },
  { name: 'global suggestions toggle helpers exist', pass: /export function areSuggestionsEnabled/.test(src('value/seen.ts')) && /export function setSuggestionsEnabled/.test(src('value/seen.ts')) },
  { name: 'AriaCapabilities lists the 4 proof-points', pass: /conosce già la scheda/.test(src('value/AriaCapabilities.tsx')) && /istruzioni aggiuntive/i.test(src('value/AriaCapabilities.tsx')) && /a voce/.test(src('value/AriaCapabilities.tsx')) && /condizioni/.test(src('value/AriaCapabilities.tsx')) },
  { name: 'AriaCapabilities positioning line present', pass: /non tiene solo l'elenco/i.test(src('value/AriaCapabilities.tsx')) },
  { name: 'AriaCapabilities keeps trainer in control', pass: /tu (decidi|verifichi)/i.test(src('value/AriaCapabilities.tsx')) },
  { name: 'ContextualHint uses seen helper and is dismissible', pass: /isSeen/.test(src('value/ContextualHint.tsx')) && /markSeen/.test(src('value/ContextualHint.tsx')) && /ctx-hint-x/.test(src('value/ContextualHint.tsx')) },
  { name: 'ValueIntroModal shown once via seen flag before the tour', pass: /spr:value-intro-seen/.test(src('value/ValueIntroModal.tsx')) && /AriaCapabilities/.test(src('value/ValueIntroModal.tsx')) },
  { name: 'ValueIntroModal mounted in main', pass: /ValueIntroModal/.test(src('main.tsx')) },
  { name: 'contextual hints wired at the 3 key moments', pass:
    /ContextualHint/.test(src('main.tsx')) &&
    /ContextualHint/.test(src('components/AiInstructionsModal.tsx')) &&
    /ContextualHint/.test(src('screens/CaseDetailView.tsx')) },
  { name: 'Profilo drawer exposes "Cosa fa Aria"', pass: /Cosa fa Aria/.test(src('components/AccountControls.tsx')) && /AriaCapabilities/.test(src('components/AccountControls.tsx')) },
  { name: 'Profilo drawer has a global suggestions toggle', pass: /setSuggestionsEnabled/.test(src('components/AccountControls.tsx')) && /suggeriment/i.test(src('components/AccountControls.tsx')) },
  { name: 'tour step explains the why (Aria prepares drafts)', pass: /Aria (legge|prepara)/.test(src('onboarding/OnboardingWizard.tsx')) },
  { name: 'seen.ts has cadence + opt-out helpers', pass: /shouldShowHourly/.test(src('value/seen.ts')) && /clearLoginOptOuts/.test(src('value/seen.ts')) && /optOutUntilLogin/.test(src('value/seen.ts')) },
  { name: 'PanelModal shell exists', pass: /value-modal-backdrop/.test(src('value/PanelModal.tsx')) },
];

const failed = checks.filter(c => !c.pass);
for (const c of checks) console.log(`${c.pass ? '✓' : '✗'} ${c.name}`);
if (failed.length) { console.error(`\n${failed.length} value-messaging check(s) failed.`); process.exit(1); }
