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

  // ── Common (shared) ──
  'common.cancel': 'Annulla',
  'common.cancelAction': 'Annulla operazione',
  'common.confirmPrimary': 'Conferma operazione principale',
  'common.closeOrCancel': 'Chiudi o annulla',
  'common.action': 'Esegui azione',
  'common.open': 'Apri',
  'common.optional': '(opzionale)',
  'common.saving': 'Salvataggio…',

  // ── New case drawer ──
  'newcase.eyebrow': 'Scheda',
  'cases.newClient': 'Nuovo cliente',
  'newcase.nameLabel': 'Nome del cliente',
  'newcase.namePlaceholder': 'es. Marco Bianchi',
  'newcase.goalLabel': 'Obiettivo principale',
  'newcase.goalPlaceholder': 'es. ipertrofia, dimagrimento, forza…',
  'newcase.availabilityLabel': 'Disponibilità',
  'newcase.availabilityPlaceholder': 'es. 3 allenamenti/settimana, 45 min',
  'newcase.watchLabel': "Cosa vuoi che Aria tenga d'occhio?",
  'newcase.watchPlaceholder': 'es. fastidio al ginocchio, poca aderenza, plateau su squat…',
  'newcase.personalizationTitle': 'Personalizzazione Aria',
  'newcase.personalizationBody': 'Bastano questi dettagli per far capire ad Aria cosa conta per questo cliente prima ancora di caricare log o misurazioni.',
  'newcase.create': 'Crea scheda',
  'newcase.summary.goal': 'Obiettivo: {v}',
  'newcase.summary.availability': 'Disponibilità: {v}',
  'newcase.summary.watch': 'Da monitorare: {v}',
  'newcase.summary.watchQuestion': "Cosa deve tenere d'occhio Aria?",
  'newcase.createError': 'Errore creazione scheda: {msg}',

  // ── Import .spr ──
  'import.encryptedPrompt': 'Scheda protetta\n\nQuesto file .spr è cifrato. Inserisci la password usata al momento dell\'esportazione.',
  'import.cancelled': 'Importazione annullata',
  'import.unprotectedConfirm': 'Questo .spr non è protetto da password. Importalo solo se proviene da una fonte affidabile.\n\nContinuare?',
  'import.invalidFile': 'File non valido',
  'import.duplicateConfirm': 'La scheda "{title}" è già presente. \n\nOK = Sostituisci\nAnnulla = Salva come copia',
  'import.copySuffix': ' (importato)',
  'import.failed': 'Importazione fallita: {msg}',

  // ── Cases list / home ──
  'cases.backendUnreachable': 'Backend non raggiungibile e nessuna scheda locale',
  'cases.deleteConfirm': 'Eliminare la scheda? I dati sono conservati solo sul tuo dispositivo.',
  'cases.studioFallback': 'Il tuo studio',
  'cases.headline.line1': 'I MIEI',
  'cases.headline.line2': 'CLIENTI',
  'cases.searchPlaceholder': 'Cerca cliente, obiettivo…',
  'cases.clearSearch': 'Azzera ricerca',
  'cases.newClientTitle': 'Crea una nuova scheda cliente',
  'cases.import': 'Importa',
  'cases.analyzingBanner': 'Analisi AI in corso -- attendere…',
  'cases.warmingBanner': 'Sto svegliando il server -- può richiedere qualche secondo…',
  'cases.noMatch': 'Nessun cliente corrisponde a “{q}”',
  'cases.emptyTitle': 'Nessun cliente presente',
  'cases.emptyBody': "Crea la prima scheda cliente per iniziare a gestire sessioni, progressi e piani di allenamento con l'AI.",
  'cases.openCardTitle': 'Apri la scheda cliente',
  'cases.localBadge': 'locale',
  'cases.deleteCardTitle': 'Elimina scheda',
  'cases.analyzingPill': 'Analisi in corso…',
  'cases.lastDaysAgo': 'ultima {n} gg fa',
  'cases.materials': '{n} materiali',
  'cases.stats.clients': 'clienti',
  'cases.stats.sessions': 'sessioni tot.',
  'cases.stats.signals': 'segnali',
  'cases.stats.today': 'oggi',

  // ── Onboarding (profile setup) ──
  'onboard.nameRequired': 'Il nome è obbligatorio.',
  'onboard.saveError': 'Errore durante il salvataggio. Riprova.',
  'onboard.step': 'Passo {n} di 2',
  'onboard.welcomeTitle': 'Benvenuto nel tuo studio digitale.',
  'onboard.welcomeLede': 'Digital Trainer legge le schede dei tuoi clienti, organizza sessioni e progressi, e ti aiuta a preparare piani di allenamento in secondi.',
  'onboard.start': 'Inizia la configurazione',
  'onboard.profileTitle': 'Il tuo profilo trainer',
  'onboard.profileLede': 'Queste informazioni appariranno nelle schede e nei piani che generi.',
  'onboard.fullName': 'Nome completo *',
  'onboard.fullNamePlaceholder': 'Mario Rossi PT',
  'onboard.studio': 'Studio / Palestra',
  'onboard.studioPlaceholder': 'FitLab Milano',
  'onboard.enter': 'Entra in Digital Trainer',
  'onboard.skip': 'Salta per ora',

  // ── Dates ──
  'date.toBeDefined': 'da definire',
  'date.invalid': 'data non valida',
};
