// One-time "già visto" flags for value-messaging UI (modal, hints).
// Same localStorage convention used by the onboarding wizard / auth tour.
export function isSeen(key: string): boolean {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}

export function markSeen(key: string): void {
  try { localStorage.setItem(key, '1'); } catch { /* noop */ }
}

// Global on/off for ALL in-app suggestions (value modal + contextual hints + tour).
// Default ON. Does NOT affect the login page. Off is stored as '0'.
const SUGGESTIONS_KEY = 'spr:suggestions-enabled';

export function areSuggestionsEnabled(): boolean {
  try { return localStorage.getItem(SUGGESTIONS_KEY) !== '0'; } catch { return true; }
}

export function setSuggestionsEnabled(enabled: boolean): void {
  try { localStorage.setItem(SUGGESTIONS_KEY, enabled ? '1' : '0'); } catch { /* noop */ }
}

// ── Cadenza & opt-out per i pannelli ─────────────────────────────────────────
const HOUR_MS = 60 * 60 * 1000;

export function getLastShown(key: string): number {
  try { const n = Number(localStorage.getItem(`spr:lastshown:${key}`)); return Number.isFinite(n) ? n : 0; } catch { return 0; }
}
export function markShown(key: string, now: number = Date.now()): void {
  try { localStorage.setItem(`spr:lastshown:${key}`, String(now)); } catch { /* noop */ }
}
export function optOutUntilLogin(key: string): void {
  try { localStorage.setItem(`spr:optout:${key}`, '1'); } catch { /* noop */ }
}
export function isOptedOut(key: string): boolean {
  try { return localStorage.getItem(`spr:optout:${key}`) === '1'; } catch { return false; }
}
/** Rimuove tutti gli opt-out: chiamato al login (gli opt-out durano fino al prossimo accesso). */
export function clearLoginOptOuts(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('spr:optout:')) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch { /* noop */ }
}
/** Pannelli a cadenza oraria: visibili se i suggerimenti sono ON, non in opt-out, e >1h dall'ultima volta. */
export function shouldShowHourly(key: string, now: number = Date.now()): boolean {
  return areSuggestionsEnabled() && !isOptedOut(key) && (now - getLastShown(key) > HOUR_MS);
}
