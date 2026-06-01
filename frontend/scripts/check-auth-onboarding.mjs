import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '..', 'src', 'main.tsx'), 'utf8');

const checks = [
  {
    name: 'auth screen contains the product orientation copy before login',
    pass: src.includes("Gestisci i tuoi clienti con l'AI"),
  },
  {
    name: 'auth screen says outputs are drafts under professional control',
    pass: src.includes('Aria prepara le bozze, tu verifichi e consegni'),
  },
  {
    name: 'post-login app does not block users with an onboarding gate',
    pass: !src.includes('if (!onboarded) return'),
  },
  {
    name: 'app no longer persists a required plt_onboarded flag',
    pass: !src.includes('plt_onboarded'),
  },
];

const failed = checks.filter(check => !check.pass);
for (const check of checks) {
  console.log(`${check.pass ? '✓' : '✗'} ${check.name}`);
}

if (failed.length) {
  console.error(`\n${failed.length} auth/onboarding check(s) failed.`);
  process.exit(1);
}
