import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '..', 'src', 'main.tsx'), 'utf8');
const supabaseClient = readFileSync(join(__dirname, '..', 'src', 'supabaseClient.ts'), 'utf8');

const checks = [
  { name: 'auth headline leads with the Aria differentiator, not generic', pass: src.includes('Non l\'ennesimo gestionale') || src.includes('non tiene solo l\'elenco') },
  { name: 'auth screen keeps trainer in control', pass: src.includes('Aria prepara le bozze, tu verifichi e consegni') },
  {
    name: 'post-login app does not block users with an onboarding gate',
    pass: !src.includes('if (!onboarded) return'),
  },
  {
    name: 'app no longer persists a required plt_onboarded flag',
    pass: !src.includes('plt_onboarded'),
  },
  {
    name: 'local bypass auth does not require Supabase env vars',
    pass: /DEV_BYPASS_AUTH/.test(supabaseClient) && /createClient\(\s*SUPABASE_URL \?\?/.test(supabaseClient),
  },
  {
    name: 'profile readiness check cannot trap login on profile lookup errors',
    pass: /maybeSingle\(\)/.test(src) && /setProfileReady\(false\)/.test(src) && /catch\s*\{[\s\S]*setProfileReady\(false\)/.test(src),
  },
  {
    name: 'login help is non-blocking, not a modal overlay over the auth form',
    pass: !/AuthTour \/>\s*<div className="auth-shell"/.test(src) && !/auth-tour-backdrop/.test(src),
  },
  {
    name: 'successful login explicitly refreshes React auth state',
    pass:
      /AUTH_SESSION_REFRESH_EVENT/.test(src) &&
      /addEventListener\(AUTH_SESSION_REFRESH_EVENT/.test(src) &&
      /dispatchEvent\(new Event\(AUTH_SESSION_REFRESH_EVENT\)\)/.test(src),
  },
  {
    name: 'dev bypass does not override explicit logout or real login',
    pass:
      /DEV_BYPASS_SIGNED_OUT_KEY/.test(src) &&
      /makeDevBypassSession/.test(src) &&
      /sessionStorage\.setItem\(DEV_BYPASS_SIGNED_OUT_KEY/.test(src) &&
      /sessionStorage\.removeItem\(DEV_BYPASS_SIGNED_OUT_KEY/.test(src) &&
      /if \(data\.session\)/.test(src),
  },
  {
    name: 'signup immediately establishes an authenticated session',
    pass:
      /signUp\(\{ email, password \}\)/.test(src) &&
      /signupData\.session/.test(src) &&
      /signInWithPassword\(\{ email, password \}\)/.test(src) &&
      /finalizeAuthSuccess/.test(src),
  },
  {
    name: 'empty local workspace still warns when demo backend is unreachable',
    pass:
      /setCases\(localSummaries\)/.test(src) &&
      /Backend non raggiungibile e nessuna scheda locale/.test(src),
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
