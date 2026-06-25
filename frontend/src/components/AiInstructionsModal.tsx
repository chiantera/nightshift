/**
 * AiInstructionsModal — a reusable "pre-flight" step shown before a non-chat AI
 * action (Analizza, Crea bozza, …). It collects OPTIONAL free-text instructions
 * that steer Aria's response, then runs the pending action with them.
 *
 * One-shot: the textarea is empty every time. The inline Aria bar and the FAB
 * chat do NOT use this — they're conversational already.
 *
 * Drive it with a single piece of state in the host screen:
 *   const [pendingAi, setPendingAi] = useState<AiInstructionsRequest | null>(null);
 *   ...open it...  setPendingAi({ title, actionLabel, run: (instr) => doTheThing(instr) });
 *   <AiInstructionsModal request={pendingAi} onClose={() => setPendingAi(null)} />
 */
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import ContextualHint from '../value/ContextualHint';
import { ARIA_FOCUS_PRESETS, ariaSetupLabels } from '../value/personalization';
import { useT, renderRich } from '../i18n/index.ts';

export interface AiInstructionsRequest {
  /** Heading, e.g. "Analizza con Aria" or "Bozza: Piano settimana". */
  title: string;
  /** Confirm-button label, e.g. "Analizza" / "Crea bozza" / "Avvia Pro". */
  actionLabel: string;
  /** Optional seed text, used by quick focus chips in the upload flow. */
  initialInstructions?: string;
  /** Runs the real action with the (possibly empty) instructions. */
  run: (instructions: string) => void | Promise<void>;
}

export default function AiInstructionsModal({ request, onClose }: { request: AiInstructionsRequest | null; onClose: () => void }) {
  const t = useT();
  const [text, setText] = useState('');
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const setupLabels = ariaSetupLabels();

  useEffect(() => {
    if (request) {
      setText(request.initialInstructions ?? '');
      setSelectedPresetIds([]);
      const t = setTimeout(() => ref.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [request]);

  if (!request) return null;

  const togglePreset = (id: string) => {
    setSelectedPresetIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const proceed = () => {
    const run = request.run;
    const presetInstructions = selectedPresetIds
      .map(id => ARIA_FOCUS_PRESETS.find(p => p.id === id)?.instruction)
      .filter(Boolean) as string[];
    const instructions = [...presetInstructions, text.trim()].filter(Boolean).join('\n');
    onClose();
    run(instructions);
  };

  return (
    <div className="ai-instr-backdrop" onClick={onClose}>
      <div className="ai-instr-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={request.title}>
        <div className="ai-instr-head">
          <span className="ai-instr-icon"><Sparkles size={16} /></span>
          <h3 className="ai-instr-title">{request.title}</h3>
        </div>
        <p className="ai-instr-sub">{renderRich(t('aiinstr.sub'))}</p>
        {setupLabels.length > 0 && (
          <div className="ai-pref-strip" aria-label={t('aiinstr.prefsLabel')}>
            <span>{t('aiinstr.prefs')}</span>
            {setupLabels.slice(0, 4).map(label => <strong key={label}>{label}</strong>)}
          </div>
        )}
        <div className="ai-focus-grid">
          {ARIA_FOCUS_PRESETS.map(preset => {
            const on = selectedPresetIds.includes(preset.id);
            return (
              <button
                key={preset.id}
                type="button"
                className={`ai-focus-chip${on ? ' ai-focus-chip--on' : ''}`}
                onClick={() => togglePreset(preset.id)}
              >
                {on && <CheckCircle2 size={13} />}
                {preset.label}
              </button>
            );
          })}
        </div>
        <ContextualHint id="istruzioni">{t('aiinstr.hint')}</ContextualHint>
        <textarea
          ref={ref}
          className="ai-instr-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('aiinstr.placeholder')}
          rows={3}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); proceed(); }
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
          }}
        />
        <div className="ai-instr-actions">
          <button type="button" className="ghost-button" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="primary-button" onClick={proceed} title={t('aiinstr.proceedTitle')}>{request.actionLabel}</button>
        </div>
      </div>
    </div>
  );
}
