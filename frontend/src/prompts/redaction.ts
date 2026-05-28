export const REDACT_DETECT_PROMPT = (_ctx: string): string =>
  `Identifica le informazioni personali sensibili nel seguente testo che devono essere anonimizzate per la privacy del cliente.\n\n${_ctx}`;

export const REDACT_APPLY_PROMPT = (_ctx: string, _rules?: string): string =>
  `Anonimizza le informazioni personali sensibili nel seguente testo. Sostituisci nomi, indirizzi, contatti e altri dati identificativi con placeholder generici (es. [NOME], [INDIRIZZO]).\n\n${_ctx}`;
