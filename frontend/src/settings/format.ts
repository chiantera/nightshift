import { getPrefs } from './settingsStore.ts';

const LB_PER_KG = 2.20462;
const CM_PER_IN = 2.54;

export function formatWeight(kg: number | null | undefined): string {
  if (kg == null || !Number.isFinite(kg)) return '—';
  const p = getPrefs();
  if (p.weightUnit === 'lb') return `${Math.round(kg * LB_PER_KG)} lb`;
  return `${Math.round(kg * 10) / 10} kg`;
}

export function formatLength(cm: number | null | undefined): string {
  if (cm == null || !Number.isFinite(cm)) return '—';
  const p = getPrefs();
  if (p.lengthUnit === 'in') return `${Math.round(cm / CM_PER_IN)} in`;
  return `${Math.round(cm)} cm`;
}
