import { en, type MessageKey } from './locales/en';
import { es } from './locales/es';
import { ptBR } from './locales/pt-BR';
import type { Message } from './types';

export const LOCALES = ['en', 'es', 'pt-BR'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const catalogues: Record<Locale, Record<MessageKey, Message>> = {
  en,
  es,
  'pt-BR': ptBR,
};

/** Each language is listed in its own language, so people can find theirs. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the best supported locale for a list of BCP 47 tags (e.g. `navigator.languages`).
 * Exact matches win; otherwise the language subtag is compared ("pt-PT" -> "pt-BR", "es-MX" -> "es").
 */
export function matchLocale(requested: readonly string[]): Locale {
  for (const tag of requested) {
    const exact = LOCALES.find((locale) => locale.toLowerCase() === tag.toLowerCase());
    if (exact) return exact;
    const language = tag.split('-')[0]?.toLowerCase();
    const partial = LOCALES.find((locale) => locale.split('-')[0]?.toLowerCase() === language);
    if (partial) return partial;
  }
  return DEFAULT_LOCALE;
}

export type { MessageKey };
