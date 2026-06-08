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
  { name: 'FirstRunWizard is a compact Aria setup with mandatory acknowledgement', pass:
    /saveAriaSetup/.test(src('value/FirstRunWizard.tsx')) &&
    /loadAriaSetup/.test(src('value/FirstRunWizard.tsx')) &&
    /hasCompleteAriaSetup/.test(src('value/FirstRunWizard.tsx')) &&
    /SPECIALTY_OPTIONS/.test(src('value/FirstRunWizard.tsx')) &&
    /recordAcceptance/.test(src('value/FirstRunWizard.tsx')) &&
    /disabled=\{!accepted\}/.test(src('value/FirstRunWizard.tsx')) },
  { name: 'Aria setup supports Altro inputs for specialties and output formats', pass:
    /otherSpecialty/.test(src('value/FirstRunWizard.tsx')) &&
    /otherOutputStyle/.test(src('value/FirstRunWizard.tsx')) &&
    /Altro/.test(src('value/FirstRunWizard.tsx')) },
  { name: 'Aria setup output format supports multiple choices', pass:
    /outputStyles/.test(src('value/FirstRunWizard.tsx')) &&
    /toggleOutputStyle/.test(src('value/FirstRunWizard.tsx')) &&
    /outputStyles\.includes/.test(src('value/FirstRunWizard.tsx')) },
  { name: 'Aria setup is required config, not suppressed by generic suggestions', pass:
    !/areSuggestionsEnabled/.test(src('value/FirstRunWizard.tsx')) &&
    !/isOptedOut/.test(src('value/FirstRunWizard.tsx')) &&
    /hasCompleteAriaSetup/.test(src('value/FirstRunWizard.tsx')) },
  { name: 'Aria setup includes expanded tone/style options', pass:
    /Empatico/.test(src('value/personalization.ts')) &&
    /Sintetico/.test(src('value/personalization.ts')) &&
    /Educativo/.test(src('value/personalization.ts')) },
  { name: 'FirstRunWizard mounted in main + login clears opt-outs', pass: /FirstRunWizard/.test(src('main.tsx')) && /clearLoginOptOuts/.test(src('main.tsx')) },
  { name: 'contextual hints wired at the 2 key moments (istruzioni modal + drafts section)', pass:
    /ContextualHint/.test(src('components/AiInstructionsModal.tsx')) &&
    /ContextualHint/.test(src('screens/CaseDetailView.tsx')) },
  { name: 'Aria focus presets are visible before analysis and drafts', pass:
    /ARIA_FOCUS_PRESETS/.test(src('components/AiInstructionsModal.tsx')) &&
    /ai-focus-chip/.test(src('components/AiInstructionsModal.tsx')) &&
    /initialInstructions/.test(src('components/AiInstructionsModal.tsx')) },
  { name: 'new-client creation captures personalization facts', pass:
    /Obiettivo principale/.test(src('main.tsx')) &&
    /Disponibilita/.test(src('main.tsx')) &&
    /Cosa vuoi che Aria tenga d'occhio/.test(src('main.tsx')) &&
    /case_summary: summaryParts/.test(src('main.tsx')) },
  { name: 'upload drawer shows inline personalization preview + focus chips', pass:
    /Personalizzazione pronta/.test(src('components/MultiFileUploadDrawer.tsx')) &&
    /upload-focus-chip/.test(src('components/MultiFileUploadDrawer.tsx')) &&
    /onAnalyze\(selectedFocus\?\.instruction\)/.test(src('components/MultiFileUploadDrawer.tsx')) },
  { name: 'case page shows personalization evidence and passes preferences into prompts', pass:
    /PersonalizationEvidence/.test(src('screens/CaseDetailView.tsx')) &&
    /combineAriaInstructions/.test(src('screens/CaseDetailView.tsx')) &&
    /Aria ha personalizzato usando/.test(src('screens/CaseDetailView.tsx')) },
  { name: 'Settings help section exposes "Cosa fa Aria"', pass: /Cosa fa Aria/.test(src('settings/sections/HelpSection.tsx')) && /AriaCapabilities/.test(src('settings/sections/HelpSection.tsx')) },
  { name: 'Settings help section has a global suggestions toggle', pass: /setSuggestionsEnabled/.test(src('settings/sections/HelpSection.tsx')) && /suggeriment/i.test(src('settings/sections/HelpSection.tsx')) },
  { name: 'tour step explains the why (Aria prepares drafts)', pass: /Aria (legge|prepara)/.test(src('onboarding/OnboardingWizard.tsx')) },
  { name: 'seen.ts has cadence + opt-out helpers', pass: /shouldShowHourly/.test(src('value/seen.ts')) && /clearLoginOptOuts/.test(src('value/seen.ts')) && /optOutUntilLogin/.test(src('value/seen.ts')) },
  { name: 'PanelModal shell exists', pass: /value-modal-backdrop/.test(src('value/PanelModal.tsx')) },
  { name: 'InfoPanelModal remains available for future contextual panels', pass: /isOptedOut/.test(src('value/InfoPanelModal.tsx')) && /openOverlay/.test(src('value/InfoPanelModal.tsx')) },
  { name: 'PIN screen has a Logout escape', pass: /onLogout/.test(src('lock/LockScreen.tsx')) && /Logout/.test(src('lock/LockScreen.tsx')) && /onLogout/.test(src('lock/LockGate.tsx')) },
  { name: 'overlay gate pauses the tour while a value panel is open', pass:
    /openOverlay/.test(src('value/overlayGate.ts')) &&
    /useAnyOverlayOpen/.test(src('onboarding/OnboardingWizard.tsx')) && /overlayOpen/.test(src('onboarding/OnboardingWizard.tsx')) &&
    /openOverlay/.test(src('value/FirstRunWizard.tsx')) && /openOverlay/.test(src('value/InfoPanelModal.tsx')) },
  { name: 'userStorage module provides setStorageUser and userKey', pass:
    /setStorageUser/.test(src('storage/userStorage.ts')) &&
    /export function userKey/.test(src('storage/userStorage.ts')) },
  { name: 'seen.ts uses userKey for all storage access', pass:
    /userKey/.test(src('value/seen.ts')) &&
    /clearLoginOptOuts/.test(src('value/seen.ts')) },
  { name: 'Settings Aria section edits Aria configuration in edit mode', pass:
    /Configurazione Aria/.test(src('settings/sections/AriaSection.tsx')) &&
    /editMode/.test(src('settings/sections/AriaSection.tsx')) &&
    /FirstRunWizard/.test(src('settings/sections/AriaSection.tsx')) },
];

const failed = checks.filter(c => !c.pass);
for (const c of checks) console.log(`${c.pass ? '✓' : '✗'} ${c.name}`);
if (failed.length) { console.error(`\n${failed.length} value-messaging check(s) failed.`); process.exit(1); }
