// Runtime: node --experimental-strip-types scripts/check-settings-prefs.mjs
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
  clear: () => store.clear(),
  get length() { return store.size; },
  key: (i) => [...store.keys()][i] ?? null,
};

const { getPrefs, setPref, DEFAULT_PREFS } = await import('../src/settings/settingsStore.ts');
const { formatWeight, formatLength } = await import('../src/settings/format.ts');

let failed = 0;
const ok = (name, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed++;
};

// getPrefs() deep-equals DEFAULT_PREFS when empty
const prefs = getPrefs();
ok('getPrefs() keys match DEFAULT_PREFS', JSON.stringify(prefs) === JSON.stringify(DEFAULT_PREFS));
ok('DEFAULT_PREFS.weightUnit === kg', DEFAULT_PREFS.weightUnit === 'kg');

// formatWeight default (kg)
ok('formatWeight(80) === "80 kg"', formatWeight(80) === '80 kg');

// after setPref weightUnit → lb
setPref('weightUnit', 'lb');
ok('formatWeight(80) after lb === "176 lb"', formatWeight(80) === '176 lb');

// formatLength default (cm)
ok('formatLength(180) === "180 cm"', formatLength(180) === '180 cm');

// after setPref lengthUnit → in
setPref('lengthUnit', 'in');
ok('formatLength(180) after in === "71 in"', formatLength(180) === '71 in');

if (failed) {
  console.error(`\n${failed} settings-prefs check(s) failed.`);
  process.exit(1);
}
console.log('\nsettings-prefs checks passed');
