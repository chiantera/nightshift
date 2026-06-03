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
];

const failed = checks.filter(c => !c.pass);
for (const c of checks) console.log(`${c.pass ? '✓' : '✗'} ${c.name}`);
if (failed.length) { console.error(`\n${failed.length} value-messaging check(s) failed.`); process.exit(1); }
