// Tiny pub/sub used to advance the onboarding wizard from real app actions
// (button clicks / state transitions) without threading React context through
// the lazy-loaded CaseDetailView. No dependencies.

import { userKey } from '../storage/userStorage';

export type WizardEvent =
  | 'new-case-drawer-opened'
  | 'upload-opened'
  | 'upload-closed'
  | 'material-added'
  | 'analyze-started';

type Handler = () => void;
const handlers: Partial<Record<WizardEvent, Set<Handler>>> = {};

function emit(event: WizardEvent): void {
  handlers[event]?.forEach(h => { try { h(); } catch { /* noop */ } });
}

function on(event: WizardEvent, cb: Handler): () => void {
  (handlers[event] ??= new Set()).add(cb);
  return () => { handlers[event]?.delete(cb); };
}

export const wizardBus = { emit, on };

// ── Persistence ──────────────────────────────────────────────────────────────
// Default-on at every launch until the tester opts out ("Non mostrare più").

export function isOnboardingDismissed(): boolean {
  try { return localStorage.getItem(userKey('onboarding:dismissed')) === '1'; } catch { return false; }
}

export function dismissOnboarding(): void {
  try { localStorage.setItem(userKey('onboarding:dismissed'), '1'); } catch { /* noop */ }
}

export function isOnboardingActive(): boolean {
  return !isOnboardingDismissed();
}
