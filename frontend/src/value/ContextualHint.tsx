import { useState, type ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import { isSeen, markSeen, areSuggestionsEnabled } from './seen';

/**
 * Hint inline non bloccante, mostrato una sola volta per `id`.
 * Si autodistrugge dopo il dismiss e non riappare (localStorage).
 * Rispetta l'interruttore globale dei suggerimenti (Profilo).
 */
export default function ContextualHint({ id, children }: { id: string; children: ReactNode }) {
  const storageKey = `spr:hint:${id}`;
  const [show, setShow] = useState(() => areSuggestionsEnabled() && !isSeen(storageKey));
  if (!show) return null;
  const close = () => { markSeen(storageKey); setShow(false); };
  return (
    <div className="ctx-hint" role="note">
      <Lightbulb size={16} />
      <div>{children}</div>
      <button type="button" className="ctx-hint-x" aria-label="Ho capito" onClick={close}>✕</button>
    </div>
  );
}
