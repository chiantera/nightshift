import { userKey } from '../storage/userStorage.ts';

export type Locale = 'it' | 'en';

export interface AppPrefs {
  locale: Locale;
  weightUnit: 'kg' | 'lb';
  lengthUnit: 'cm' | 'in';
  dateFormat: 'dmy' | 'mdy' | 'iso';
  weekStart: 'mon' | 'sun';
  anonymizeByDefault: boolean;
  defaultAnalysisMode: 'flash' | 'pro';
  confirmBeforePro: boolean;
}

/** First-run default: follow the browser, Italian only for it-* locales. User can override in Settings. */
function detectLocale(): Locale {
  try {
    return (navigator?.language ?? '').toLowerCase().startsWith('it') ? 'it' : 'en';
  } catch {
    return 'it';
  }
}

export const DEFAULT_PREFS: AppPrefs = {
  locale: detectLocale(),
  weightUnit: 'kg',
  lengthUnit: 'cm',
  dateFormat: 'dmy',
  weekStart: 'mon',
  anonymizeByDefault: false,
  defaultAnalysisMode: 'flash',
  confirmBeforePro: true,
};

const KEY = 'app-prefs:v1';
const listeners = new Set<() => void>();

export function getPrefs(): AppPrefs {
  try {
    const raw = localStorage.getItem(userKey(KEY));
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setPref<K extends keyof AppPrefs>(key: K, value: AppPrefs[K]): void {
  const next = { ...getPrefs(), [key]: value };
  localStorage.setItem(userKey(KEY), JSON.stringify(next));
  listeners.forEach(fn => fn());
}

export function subscribePrefs(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
