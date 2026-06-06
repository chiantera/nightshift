export type AriaSetup = {
  specialties: string[];
  outputStyles: string[];
  tone: string;
};

export type AriaFocusPreset = {
  id: string;
  label: string;
  instruction: string;
};

import { userKey } from '../storage/userStorage';

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
  {
    id: 'plateau',
    label: 'Plateau',
    instruction: 'Concentrati su plateau, regressioni o segnali che indicano uno stallo nel percorso.',
  },
  {
    id: 'progressione',
    label: 'Progressione',
    instruction: 'Proponi una progressione concreta per le prossime settimane, rispettando disponibilita e limiti del cliente.',
  },
  {
    id: 'aderenza',
    label: 'Aderenza',
    instruction: 'Valuta aderenza, costanza e ostacoli pratici che possono impedire al cliente di seguire il piano.',
  },
  {
    id: 'piano-settimana',
    label: 'Piano 7 giorni',
    instruction: 'Prepara indicazioni operative per un piano di allenamento dei prossimi 7 giorni.',
  },
  {
    id: 'messaggio-cliente',
    label: 'Messaggio cliente',
    instruction: 'Evidenzia cosa comunicare al cliente in modo chiaro, professionale e motivante.',
  },
];

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
    ...setup.specialties,
    ...setup.outputStyles,
    setup.tone,
  ].filter(Boolean);
}

export function buildTrainerPreferenceInstructions(): string {
  const setup = loadAriaSetup();
  if (!setup) return '';
  const parts = [
    setup.specialties.length ? `specializzazioni/interessi: ${setup.specialties.join(', ')}` : '',
    setup.outputStyles.length ? `formati preferiti: ${setup.outputStyles.join(', ')}` : '',
    setup.tone ? `tono preferito: ${setup.tone}` : '',
  ].filter(Boolean);
  return parts.length
    ? `Preferenze del trainer per Aria: ${parts.join('; ')}.`
    : '';
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
      return { value: '—', label: `fermo da ${overdue} gg`, stalled: true };
    }
  }

  // Pending / no materials yet
  if (c.is_pending || c.material_count === 0) {
    return { value: '—', label: 'nessun materiale', stalled: false };
  }

  return {
    value: String(c.material_count),
    unit: undefined,
    label: 'materiali',
    stalled: false,
  };
}
