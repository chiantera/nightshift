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
