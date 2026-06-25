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

  // ── Dates ──
  'date.toBeDefined': 'to be defined',
  'date.invalid': 'invalid date',
};
