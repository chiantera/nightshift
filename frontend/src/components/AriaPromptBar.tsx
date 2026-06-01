import React from 'react';
import { Send, Sparkles } from 'lucide-react';

export default function AriaPromptBar({ onOpenChat }: { onOpenChat: (msg?: string) => void }) {
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
        placeholder="Sono Aria, il tuo coach AI. Chiedimi qualunque cosa. Sono qui per rispondere alle tue domande!"
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
      <button title="Invia domanda ad Aria" className="aria-prompt-send" onClick={submit} tabIndex={-1} aria-label="Invia">
        <Send size={14} />
      </button>
    </div>
  );
}
