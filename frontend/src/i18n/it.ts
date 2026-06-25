import type { Catalog } from './index.ts';

// Italian catalog. Keep keys in sync with en.ts; en falls back to these when a key is missing.
export const it: Catalog = {
  // ── Common ──
  'common.close': 'Chiudi',
  'common.dontShowAgain': 'Non mostrare più',
  'common.loading': 'Caricamento…',

  // ── Brand ──
  'brand.name': 'Digital Trainer',
  'brand.sub': 'Coach AI per personal trainer',

  // ── Auth: help card ──
  'auth.help.title': 'Prima di entrare',
  'auth.help.step1': "Leggi l'avvertimento.",
  'auth.help.step2': 'Spunta “Ho letto e compreso”.',
  'auth.help.step3': 'Accedi o registrati con la tua email.',

  // ── Auth: forgot password ──
  'auth.forgot.noEmail': 'Inserisci la tua email qui sopra, poi tocca “Password dimenticata?”.',
  'auth.forgot.sent': 'Ti abbiamo inviato un’email per reimpostare la password. Controlla anche lo spam.',
  'auth.forgot.link': 'Password dimenticata?',

  // ── Auth: disclaimer (supports **bold**) ──
  'auth.disclaimer.important': "⚠️ **Importante.** L'intelligenza artificiale può commettere errori: **controlla sempre** ogni contenuto generato prima di usarlo. Sei tu il professionista responsabile del tuo lavoro — affidati alla tua esperienza e competenza, alla tua formazione professionale, e **per qualsiasi aspetto di salute rivolgiti a un medico qualificato**. Digital Trainer è uno strumento di supporto organizzativo e di bozza per personal trainer: non fornisce consulenza, diagnosi o prescrizioni mediche e non sostituisce il giudizio di un professionista qualificato.",
  'auth.disclaimer.privacy': '🔒 **Privacy.** Digital Trainer applica letteralmente i più alti standard di protezione della privacy: a parte i dati di accesso (email e password, che non saranno mai usati a fini commerciali), **nessun dato viene salvato da nessuna parte se non su QUESTO dispositivo**. In ogni caso, sentiti libero di usare pseudonimi o soprannomi al posto dei nomi reali dei tuoi clienti, e sfrutta la funzione “Anonimizza” integrata nell\'app.',
  'auth.disclaimer.feedback': '💬 **Feedback.** Per domande, commenti o consigli scrivi a **digitaltrainer.dev@gmail.com** — allega pure screenshot se ti aiutano a spiegare. Ogni segnalazione è benvenuta.',
  'auth.accept.label': 'Ho letto e compreso questo avvertimento.',
  'auth.accept.hint': 'Spunta la casella qui sopra per continuare.',

  // ── Auth: form ──
  'auth.kicker': 'Accesso riservato',
  'auth.tab.login': 'Accedi',
  'auth.tab.signup': 'Registrati',
  'auth.tab.title': 'Cambia modalità di accesso',
  'auth.email': 'Email',
  'auth.password': 'Password (min. 6 caratteri)',
  'auth.submit.login': 'Accedi',
  'auth.submit.signup': 'Crea account',
  'auth.submit.title': 'Conferma dati di accesso',

  // ── Auth: hero / value ──
  'auth.hero.title': "Non l'ennesimo gestionale clienti. È Aria che lavora coi dettagli reali di ognuno.",
  'auth.hero.lede': 'Aria conosce ogni cliente — condizioni, progressi, obiettivi — e ti prepara piani, report e messaggi su misura, in una frazione del tempo. Tu resti il professionista al comando: Aria prepara le bozze, tu verifichi e consegni.',
  'auth.features.label': 'Cosa fa Digital Trainer',
  'auth.feature.1.title': 'Trasforma note e misurazioni in un piano chiaro',
  'auth.feature.1.desc': "Carica qualsiasi appunto o misurazione: Aria le struttura in una scheda pronta all'uso.",
  'auth.feature.2.title': 'Aria trova plateau e segnali sui tuoi clienti',
  'auth.feature.2.desc': 'Analisi dei progressi cliente per cliente: identifica stalli, rischi e punti di forza prima che tu li veda.',
  'auth.feature.3.title': 'Bozze pronte da rifinire e consegnare',
  'auth.feature.3.desc': 'Piano settimanale, report progressi, messaggio motivazionale — generati sui dati reali, da te approvati.',
  'auth.feature.4.title': 'Tutto sul tuo dispositivo, esporti quando vuoi',
  'auth.feature.4.desc': 'Nessun dato caricato su cloud senza consenso. Backup cifrato .spr: i tuoi clienti restano tuoi.',

  // ── Settings: language + units ──
  'settings.language.title': 'Lingua',
  'settings.units.title': 'Unità & formato',
  'settings.units.weight': 'Peso',
  'settings.units.length': 'Lunghezza',
  'settings.units.dateFormat': 'Formato data',
  'settings.units.weekStart': 'Inizio settimana',
  'settings.units.weekStart.mon': 'Lun',
  'settings.units.weekStart.sun': 'Dom',
  'settings.units.date.dmy': 'gg/mm/aaaa',
  'settings.units.date.mdy': 'mm/gg/aaaa',
  'settings.units.date.iso': 'aaaa-mm-gg',

  // ── Dates ──
  'date.toBeDefined': 'da definire',
  'date.invalid': 'data non valida',
};
