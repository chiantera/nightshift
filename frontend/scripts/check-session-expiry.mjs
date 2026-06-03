// Runtime test del TTL di sessione (72h). Esegui con:
//   node --experimental-strip-types scripts/check-session-expiry.mjs
// Shim minimale di localStorage perché il modulo gira fuori dal browser.

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
  clear: () => store.clear(),
};

const {
  SESSION_TTL_MS, recordAcceptance, ensureAcceptanceTs, isSessionExpired, clearAcceptance,
} = await import('../src/auth/sessionExpiry.ts');

let failed = 0;
const ok = (name, cond) => { console.log(`${cond ? '✓' : '✗'} ${name}`); if (!cond) failed++; };

ok('TTL è 72 ore', SESSION_TTL_MS === 72 * 60 * 60 * 1000);

// Senza timestamp: non scaduta (non sloggiamo a sorpresa)
store.clear();
ok('senza ts → non scaduta', isSessionExpired() === false);

// Appena accettato: non scaduta
const now = 1_000_000_000_000;
recordAcceptance(now);
ok('appena accettato → non scaduta', isSessionExpired(now) === false);

// 71h dopo: non scaduta; 73h dopo: scaduta
ok('a 71h → non scaduta', isSessionExpired(now + 71 * 3600 * 1000) === false);
ok('a 73h → scaduta', isSessionExpired(now + 73 * 3600 * 1000) === true);

// ensureAcceptanceTs innesta solo se manca
store.clear();
ensureAcceptanceTs(now);
ok('ensure innesta ts quando manca', isSessionExpired(now) === false && localStorage.getItem('spr:session-accepted-ts') === String(now));
ensureAcceptanceTs(now + 80 * 3600 * 1000); // non deve sovrascrivere
ok('ensure non sovrascrive un ts esistente', localStorage.getItem('spr:session-accepted-ts') === String(now));

// clearAcceptance rimuove
clearAcceptance();
ok('clear rimuove il ts', localStorage.getItem('spr:session-accepted-ts') === null);

if (failed) { console.error(`\n${failed} session-expiry check(s) failed.`); process.exit(1); }
console.log('\nsession-expiry OK');
