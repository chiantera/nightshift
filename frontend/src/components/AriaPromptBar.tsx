import React from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useT } from '../i18n/index.ts';

export default function AriaPromptBar({ onOpenChat }: { onOpenChat: (msg?: string) => void }) {
  const t = useT();
  const [val, setVal] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    onOpenChat(val.trim() || undefined);
    setVal('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setVal(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <div className="aria-prompt-bar" style={{ alignItems: 'center' }}>
      <div className="aria-prompt-icon"><Sparkles size={16} /></div>
      <textarea
        ref={textareaRef}
        className="aria-prompt-input"
        placeholder={t('ariabar.placeholder')}
        value={val}
        onChange={handleInput}
        rows={2}
        style={{ overflowY: 'auto', minHeight: '40px', alignSelf: 'center' }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button title={t('ariabar.sendTitle')} className="aria-prompt-send" onClick={submit} tabIndex={-1} aria-label={t('ariabar.send')}>
        <Send size={14} />
      </button>
    </div>
  );
}
