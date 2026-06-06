import { userKey } from '../storage/userStorage';

export function isSeen(key: string): boolean {
  try { return localStorage.getItem(userKey(key)) === '1'; } catch { return false; }
}

export function markSeen(key: string): void {
  try { localStorage.setItem(userKey(key), '1'); } catch { /* noop */ }
}

const SUGGESTIONS_SUBKEY = 'suggestions-enabled';

export function areSuggestionsEnabled(): boolean {
  try { return localStorage.getItem(userKey(SUGGESTIONS_SUBKEY)) !== '0'; } catch { return true; }
}

export function setSuggestionsEnabled(enabled: boolean): void {
  try { localStorage.setItem(userKey(SUGGESTIONS_SUBKEY), enabled ? '1' : '0'); } catch { /* noop */ }
}

const HOUR_MS = 60 * 60 * 1000;

export function getLastShown(key: string): number {
  try { const n = Number(localStorage.getItem(userKey(`lastshown:${key}`))); return Number.isFinite(n) ? n : 0; } catch { return 0; }
}
export function markShown(key: string, now: number = Date.now()): void {
  try { localStorage.setItem(userKey(`lastshown:${key}`), String(now)); } catch { /* noop */ }
}
export function optOutUntilLogin(key: string): void {
  try { localStorage.setItem(userKey(`optout:${key}`), '1'); } catch { /* noop */ }
}
export function isOptedOut(key: string): boolean {
  try { return localStorage.getItem(userKey(`optout:${key}`)) === '1'; } catch { return false; }
}
/** Rimuove tutti gli opt-out dell'utente corrente: chiamato al login. */
export function clearLoginOptOuts(): void {
  try {
    const prefix = userKey('optout:');
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch { /* noop */ }
}
/** Pannelli a cadenza oraria: visibili se i suggerimenti sono ON, non in opt-out, e >1h dall'ultima volta. */
export function shouldShowHourly(key: string, now: number = Date.now()): boolean {
  return areSuggestionsEnabled() && !isOptedOut(key) && (now - getLastShown(key) > HOUR_MS);
}
