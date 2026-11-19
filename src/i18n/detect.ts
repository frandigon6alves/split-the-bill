import { readStorage, writeStorage } from '../state/storage';
import { isLocale, matchLocale, type Locale } from './locales';

const LOCALE_STORAGE_KEY = 'split-the-bill:locale';

/** Saved choice first, then the browser's preferred languages, then English. */
export function detectLocale(): Locale {
  const saved = readStorage(LOCALE_STORAGE_KEY);
  if (isLocale(saved)) return saved;
  if (typeof navigator === 'undefined') return matchLocale([]);
  const preferred = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  return matchLocale(preferred);
}

export function saveLocale(locale: Locale): void {
  writeStorage(LOCALE_STORAGE_KEY, locale);
}
