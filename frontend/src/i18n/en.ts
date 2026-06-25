import type { Catalog } from './index.ts';

// English catalog. Keys mirror it.ts; missing keys fall back to Italian.
export const en: Catalog = {
  // ── Common ──
  'common.close': 'Close',
  'common.dontShowAgain': "Don't show again",
  'common.loading': 'Loading…',

  // ── Brand ──
  'brand.name': 'Digital Trainer',
  'brand.sub': 'AI coach for personal trainers',

  // ── Auth: help card ──
  'auth.help.title': 'Before you start',
  'auth.help.step1': 'Read the disclaimer.',
  'auth.help.step2': 'Tick “I have read and understood”.',
  'auth.help.step3': 'Sign in or sign up with your email.',

  // ── Auth: forgot password ──
  'auth.forgot.noEmail': 'Enter your email above, then tap “Forgot password?”.',
  'auth.forgot.sent': 'We’ve sent you an email to reset your password. Check your spam folder too.',
  'auth.forgot.link': 'Forgot password?',

  // ── Auth: disclaimer (supports **bold**) ──
  'auth.disclaimer.important': '⚠️ **Important.** AI can make mistakes: **always check** every generated piece of content before using it. You are the professional responsible for your work — rely on your experience and expertise, on your professional training, and **for any health-related matter consult a qualified doctor**. Digital Trainer is an organisational and drafting support tool for personal trainers: it does not provide medical advice, diagnosis or prescriptions and does not replace the judgement of a qualified professional.',
  'auth.disclaimer.privacy': '🔒 **Privacy.** Digital Trainer literally applies the highest privacy-protection standards: apart from your login details (email and password, which will never be used for commercial purposes), **no data is stored anywhere other than on THIS device**. Either way, feel free to use pseudonyms or nicknames instead of your clients’ real names, and use the “Anonymise” feature built into the app.',
  'auth.disclaimer.feedback': '💬 **Feedback.** For questions, comments or suggestions write to **digitaltrainer.dev@gmail.com** — feel free to attach screenshots if they help explain. Every report is welcome.',
  'auth.accept.label': 'I have read and understood this disclaimer.',
  'auth.accept.hint': 'Tick the box above to continue.',

  // ── Auth: form ──
  'auth.kicker': 'Restricted access',
  'auth.tab.login': 'Sign in',
  'auth.tab.signup': 'Sign up',
  'auth.tab.title': 'Switch access mode',
  'auth.email': 'Email',
  'auth.password': 'Password (min. 6 characters)',
  'auth.submit.login': 'Sign in',
  'auth.submit.signup': 'Create account',
  'auth.submit.title': 'Confirm your credentials',

  // ── Auth: hero / value ──
  'auth.hero.title': "Not just another client manager. It's Aria, working with each person's real details.",
  'auth.hero.lede': 'Aria knows every client — conditions, progress, goals — and prepares tailored plans, reports and messages in a fraction of the time. You stay the professional in charge: Aria drafts, you review and deliver.',
  'auth.features.label': 'What Digital Trainer does',
  'auth.feature.1.title': 'Turn notes and measurements into a clear plan',
  'auth.feature.1.desc': 'Upload any note or measurement: Aria structures it into a ready-to-use client sheet.',
  'auth.feature.2.title': 'Aria spots plateaus and signals across your clients',
  'auth.feature.2.desc': 'Client-by-client progress analysis: it spots stalls, risks and strengths before you do.',
  'auth.feature.3.title': 'Drafts ready to refine and deliver',
  'auth.feature.3.desc': 'Weekly plan, progress report, motivational message — generated from real data, approved by you.',
  'auth.feature.4.title': 'Everything on your device, export whenever you want',
  'auth.feature.4.desc': 'No data uploaded to the cloud without consent. Encrypted .spr backup: your clients stay yours.',

  // ── Settings: language + units ──
  'settings.language.title': 'Language',
  'settings.units.title': 'Units & format',
  'settings.units.weight': 'Weight',
  'settings.units.length': 'Length',
  'settings.units.dateFormat': 'Date format',
  'settings.units.weekStart': 'Week start',
  'settings.units.weekStart.mon': 'Mon',
  'settings.units.weekStart.sun': 'Sun',
  'settings.units.date.dmy': 'dd/mm/yyyy',
  'settings.units.date.mdy': 'mm/dd/yyyy',
  'settings.units.date.iso': 'yyyy-mm-dd',

  // ── Common (shared) ──
  'common.cancel': 'Cancel',
  'common.cancelAction': 'Cancel',
  'common.confirmPrimary': 'Confirm',
  'common.closeOrCancel': 'Close or cancel',
  'common.action': 'Run action',
  'common.open': 'Open',
  'common.optional': '(optional)',
  'common.saving': 'Saving…',

  // ── New case drawer ──
  'newcase.eyebrow': 'Client sheet',
  'cases.newClient': 'New client',
  'newcase.nameLabel': "Client's name",
  'newcase.namePlaceholder': 'e.g. Marco Bianchi',
  'newcase.goalLabel': 'Main goal',
  'newcase.goalPlaceholder': 'e.g. hypertrophy, weight loss, strength…',
  'newcase.availabilityLabel': 'Availability',
  'newcase.availabilityPlaceholder': 'e.g. 3 workouts/week, 45 min',
  'newcase.watchLabel': 'What do you want Aria to keep an eye on?',
  'newcase.watchPlaceholder': 'e.g. knee discomfort, low adherence, squat plateau…',
  'newcase.personalizationTitle': 'Aria personalisation',
  'newcase.personalizationBody': 'These few details are enough for Aria to understand what matters for this client, even before you upload logs or measurements.',
  'newcase.create': 'Create sheet',
  'newcase.summary.goal': 'Goal: {v}',
  'newcase.summary.availability': 'Availability: {v}',
  'newcase.summary.watch': 'To monitor: {v}',
  'newcase.summary.watchQuestion': 'What should Aria keep an eye on?',
  'newcase.createError': 'Error creating sheet: {msg}',

  // ── Import .spr ──
  'import.encryptedPrompt': 'Protected sheet\n\nThis .spr file is encrypted. Enter the password you used when exporting it.',
  'import.cancelled': 'Import cancelled',
  'import.unprotectedConfirm': 'This .spr is not password-protected. Only import it if it comes from a trusted source.\n\nContinue?',
  'import.invalidFile': 'Invalid file',
  'import.duplicateConfirm': 'The sheet "{title}" already exists. \n\nOK = Replace\nCancel = Save as a copy',
  'import.copySuffix': ' (imported)',
  'import.failed': 'Import failed: {msg}',

  // ── Cases list / home ──
  'cases.backendUnreachable': 'Backend unreachable and no local sheets',
  'cases.deleteConfirm': 'Delete this sheet? The data is kept only on your device.',
  'cases.studioFallback': 'Your studio',
  'cases.headline.line1': 'MY',
  'cases.headline.line2': 'CLIENTS',
  'cases.searchPlaceholder': 'Search client, goal…',
  'cases.clearSearch': 'Clear search',
  'cases.newClientTitle': 'Create a new client sheet',
  'cases.import': 'Import',
  'cases.analyzingBanner': 'AI analysis in progress -- please wait…',
  'cases.warmingBanner': 'Waking up the server -- this may take a few seconds…',
  'cases.noMatch': 'No client matches “{q}”',
  'cases.emptyTitle': 'No clients yet',
  'cases.emptyBody': 'Create your first client sheet to start managing sessions, progress and training plans with AI.',
  'cases.openCardTitle': 'Open the client sheet',
  'cases.localBadge': 'local',
  'cases.deleteCardTitle': 'Delete sheet',
  'cases.analyzingPill': 'Analysis in progress…',
  'cases.lastDaysAgo': 'last {n} days ago',
  'cases.materials': '{n} materials',
  'cases.stats.clients': 'clients',
  'cases.stats.sessions': 'total sessions',
  'cases.stats.signals': 'signals',
  'cases.stats.today': 'today',

  // ── Onboarding (profile setup) ──
  'onboard.nameRequired': 'Name is required.',
  'onboard.saveError': 'Something went wrong while saving. Please try again.',
  'onboard.step': 'Step {n} of 2',
  'onboard.welcomeTitle': 'Welcome to your digital studio.',
  'onboard.welcomeLede': 'Digital Trainer reads your clients’ sheets, organises sessions and progress, and helps you prepare training plans in seconds.',
  'onboard.start': 'Start setup',
  'onboard.profileTitle': 'Your trainer profile',
  'onboard.profileLede': 'This information will appear in the sheets and plans you generate.',
  'onboard.fullName': 'Full name *',
  'onboard.fullNamePlaceholder': 'John Smith PT',
  'onboard.studio': 'Studio / Gym',
  'onboard.studioPlaceholder': 'FitLab London',
  'onboard.enter': 'Enter Digital Trainer',
  'onboard.skip': 'Skip for now',

  // ── Dates ──
  'date.toBeDefined': 'to be defined',
  'date.invalid': 'invalid date',
};
