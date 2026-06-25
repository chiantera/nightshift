import { createElement, Fragment, useSyncExternalStore, type ReactNode } from 'react';
import { getPrefs, subscribePrefs, type Locale } from '../settings/settingsStore.ts';
import { it } from './it.ts';
import { en } from './en.ts';

export type { Locale };

export type Catalog = Record<string, string>;
type Params = Record<string, string | number>;

const CATALOGS: Record<Locale, Catalog> = { it, en };

export function currentLocale(): Locale {
  return getPrefs().locale;
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

/** Resolve a key for a given locale, falling back to Italian then to the key itself. */
export function translate(locale: Locale, key: string, params?: Params): string {
  const raw = CATALOGS[locale]?.[key] ?? CATALOGS.it[key] ?? key;
  return interpolate(raw, params);
}

/** Non-reactive lookup (use inside event handlers / non-component code). */
export function t(key: string, params?: Params): string {
  return translate(currentLocale(), key, params);
}

/** Reactive translator hook — re-renders the component when the locale changes. */
export function useT(): (key: string, params?: Params) => string {
  const locale = useSyncExternalStore(
    subscribePrefs,
    () => getPrefs().locale,
    () => 'it' as Locale,
  );
  return (key: string, params?: Params) => translate(locale, key, params);
}

/**
 * Render a catalog string that uses lightweight `**bold**` markup as React nodes,
 * so disclaimers/feature copy keep their emphasis without storing HTML.
 */
export function renderRich(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return createElement(
    Fragment,
    null,
    ...parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? createElement('strong', { key: i }, part.slice(2, -2))
        : part,
    ),
  );
}
