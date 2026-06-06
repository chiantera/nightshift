import { userKey } from '../storage/userStorage';

export type ThemeChoice = 'dark' | 'light' | 'auto';
export type ResolvedTheme = 'dark' | 'light';

const KEY = 'theme';

export function getThemeChoice(): ThemeChoice {
  const v = localStorage.getItem(userKey(KEY));
  return v === 'dark' || v === 'light' || v === 'auto' ? v : 'auto';
}

export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  if (choice === 'dark' || choice === 'light') return choice;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(choice: ThemeChoice = getThemeChoice()): void {
  const resolved = resolveTheme(choice);
  document.documentElement.setAttribute('data-theme', resolved);
}

export function setThemeChoice(choice: ThemeChoice): void {
  localStorage.setItem(userKey(KEY), choice);
  applyTheme(choice);
}
