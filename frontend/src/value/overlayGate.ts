import { useSyncExternalStore } from 'react';

/**
 * Conteggio dei pannelli valore (FirstRunWizard / InfoPanelModal) attualmente aperti.
 * Serve a mettere in pausa il tour spotlight mentre un pannello è aperto, così non
 * si crea il deadlock (il tour che copre il pannello + il backdrop che disabilita i
 * pulsanti che il tour invita a premere).
 */
let count = 0;
const listeners = new Set<() => void>();
function emit(): void { listeners.forEach(l => { try { l(); } catch { /* noop */ } }); }

export function openOverlay(): void { count += 1; emit(); }
export function closeOverlay(): void { count = Math.max(0, count - 1); emit(); }
export function isAnyOverlayOpen(): boolean { return count > 0; }

function subscribe(cb: () => void): () => void { listeners.add(cb); return () => { listeners.delete(cb); }; }
function getSnapshot(): boolean { return count > 0; }

/** Hook React: true se almeno un pannello valore è aperto. */
export function useAnyOverlayOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
