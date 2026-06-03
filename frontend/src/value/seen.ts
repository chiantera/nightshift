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
