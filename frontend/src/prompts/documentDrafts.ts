import { PIANO_PROMPTS } from './pianoDrafts';

const _wrap = (promptText: string) => (ctx: string) =>
  `${ctx}\n\n---\n\n${promptText}`;

export const DOC_PROMPTS: Record<string, (ctx: string) => string> = {
  pianoSettimana:      _wrap(PIANO_PROMPTS.pianoSettimana.prompt),
  schedaMensile:       _wrap(PIANO_PROMPTS.schedaMensile.prompt),
  reportProgresso:     _wrap(PIANO_PROMPTS.reportProgresso.prompt),
  notaNutrizionale:    _wrap(PIANO_PROMPTS.notaNutrizionale.prompt),
  messaggioMotivazione: _wrap(PIANO_PROMPTS.messaggioMotivazione.prompt),
  strategy:            _wrap(PIANO_PROMPTS.pianoSettimana.prompt),
  memoria:             _wrap(PIANO_PROMPTS.reportProgresso.prompt),
  cassazione:          _wrap(PIANO_PROMPTS.schedaMensile.prompt),
  eccezione:           _wrap(PIANO_PROMPTS.notaNutrizionale.prompt),
  crossExam:           _wrap(PIANO_PROMPTS.messaggioMotivazione.prompt),
  clienteNote:         _wrap(PIANO_PROMPTS.messaggioMotivazione.prompt),
};

export const STRICT_PRECEDENT_BAN = '';
