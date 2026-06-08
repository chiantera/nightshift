import { userKey } from '../storage/userStorage.ts';

export interface AppPrefs {
  weightUnit: 'kg' | 'lb';
  lengthUnit: 'cm' | 'in';
  dateFormat: 'dmy' | 'mdy' | 'iso';
  weekStart: 'mon' | 'sun';
  anonymizeByDefault: boolean;
  defaultAnalysisMode: 'flash' | 'pro';
  confirmBeforePro: boolean;
}

export const DEFAULT_PREFS: AppPrefs = {
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
