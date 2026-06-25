export type AriaSetup = {
  specialties: string[];
  outputStyles: string[];
  tone: string;
};

export type AriaFocusPreset = {
  id: string;
  /** Canonical option keys below double as stored values; labels are localized. */
  labelKey: string;
  instructionKey: string;
};

import { userKey } from '../storage/userStorage';
import { t } from '../i18n/index.ts';

// Canonical stored values (Italian) — kept stable for back-compat with saved
// AriaSetup. Display labels are resolved via the pers.* catalog at render time.
export const SPECIALTY_OPTIONS = [
  'Ipertrofia',
  'Dimagrimento',
  'Forza',
  'Principianti',
  'Post-infortunio',
  'Ricomposizione',
];

export const OUTPUT_STYLE_OPTIONS = [
  'Scheda pratica',
  'Progressione numerica',
  'Spiegazione dettagliata',
  'Messaggio pronto per il cliente',
];

export const TONE_OPTIONS = ['Diretto', 'Motivante', 'Tecnico', 'Empatico', 'Sintetico', 'Educativo', 'Molto pratico'];

export const ARIA_FOCUS_PRESETS: AriaFocusPreset[] = [
  { id: 'plateau', labelKey: 'pers.focus.plateau.label', instructionKey: 'pers.focus.plateau.instruction' },
  { id: 'progressione', labelKey: 'pers.focus.progressione.label', instructionKey: 'pers.focus.progressione.instruction' },
  { id: 'aderenza', labelKey: 'pers.focus.aderenza.label', instructionKey: 'pers.focus.aderenza.instruction' },
  { id: 'piano-settimana', labelKey: 'pers.focus.piano-settimana.label', instructionKey: 'pers.focus.piano-settimana.instruction' },
  { id: 'messaggio-cliente', labelKey: 'pers.focus.messaggio-cliente.label', instructionKey: 'pers.focus.messaggio-cliente.instruction' },
];

/** Localized display label for a stored option value (falls back to custom text). */
export function specialtyLabel(v: string): string { const k = `pers.specialty.${v}`; const l = t(k); return l === k ? v : l; }
export function outputLabel(v: string): string { const k = `pers.output.${v}`; const l = t(k); return l === k ? v : l; }
export function toneLabel(v: string): string { const k = `pers.tone.${v}`; const l = t(k); return l === k ? v : l; }
export function focusLabel(p: AriaFocusPreset): string { return t(p.labelKey); }
export function focusInstruction(p: AriaFocusPreset): string { return t(p.instructionKey); }

export function loadAriaSetup(): AriaSetup | null {
  try {
    const raw = localStorage.getItem(userKey('aria-setup:v1'));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AriaSetup> & { outputStyle?: string };
    return {
      specialties: Array.isArray(parsed.specialties) ? parsed.specialties : [],
      outputStyles: Array.isArray(parsed.outputStyles)
        ? parsed.outputStyles
        : (parsed.outputStyle ? [parsed.outputStyle] : []),
      tone: parsed.tone || TONE_OPTIONS[0],
    };
  } catch {
    return null;
  }
}

export function saveAriaSetup(setup: AriaSetup): void {
  try { localStorage.setItem(userKey('aria-setup:v1'), JSON.stringify(setup)); } catch { /* noop */ }
}

export function ariaSetupLabels(setup: AriaSetup | null = loadAriaSetup()): string[] {
  if (!setup) return [];
  return [
    ...setup.specialties.map(specialtyLabel),
    ...setup.outputStyles.map(outputLabel),
    setup.tone ? toneLabel(setup.tone) : '',
  ].filter(Boolean);
}

export function buildTrainerPreferenceInstructions(): string {
  const setup = loadAriaSetup();
  if (!setup) return '';
  const parts = [
    setup.specialties.length ? t('pers.pref.specialties', { v: setup.specialties.map(specialtyLabel).join(', ') }) : '',
    setup.outputStyles.length ? t('pers.pref.outputs', { v: setup.outputStyles.map(outputLabel).join(', ') }) : '',
    setup.tone ? t('pers.pref.tone', { v: toneLabel(setup.tone) }) : '',
  ].filter(Boolean);
  return parts.length ? t('pers.pref.prefix', { parts: parts.join('; ') }) : '';
}

export function combineAriaInstructions(userInstructions: string): string {
  const prefs = buildTrainerPreferenceInstructions();
  return [prefs, userInstructions.trim()].filter(Boolean).join('\n');
}

// ── Hero metric ───────────────────────────────────────────────────────────────

import type { CaseSummary } from '../domain/types';

export interface HeroMetric {
  value: string;
  unit?: string;
  label: string;
  stalled?: boolean;
}

/** Returns the number of days since an ISO date string, or null if unparseable. */
function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

/**
 * Derives a hero metric for the home card from a CaseSummary.
 *
 * Stalled logic: if `next_deadline_date` is in the past by >= 7 days (overdue
 * session), we mark the client as stalled. CaseSummary has no "last activity"
 * field (created_at is regenerated at read time), so the deadline date is the
 * only reliable recency signal.
 *
 * Hero value: material_count (documents / sessions uploaded) if > 0, else '—'.
 */
export function heroMetric(c: CaseSummary): HeroMetric {
  // Stalled: deadline exists and is overdue by >= 7 days
  if (c.next_deadline_date) {
    const overdue = daysSince(c.next_deadline_date);
    if (overdue !== null && overdue >= 7) {
      return { value: '—', label: t('hero.stalled', { n: overdue }), stalled: true };
    }
  }

  // Pending / no materials yet
  if (c.is_pending || c.material_count === 0) {
    return { value: '—', label: t('hero.noMaterial'), stalled: false };
  }

  return {
    value: String(c.material_count),
    unit: undefined,
    label: t('hero.materials'),
    stalled: false,
  };
}
