import type { Locale } from './locales';

export const CURRENCIES = ['EUR', 'USD', 'BRL'] as const;
export type Currency = (typeof CURRENCIES)[number];

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value);
}

/** A sensible first guess at the currency for someone using the given locale. */
export const DEFAULT_CURRENCY: Record<Locale, Currency> = {
  en: 'USD',
  es: 'EUR',
  'pt-BR': 'BRL',
};

const formatters = new Map<string, Intl.NumberFormat>();

/** Formats integer cents as currency, e.g. 123456 -> "€1,234.56" (en) or "R$ 1.234,56" (pt-BR). */
export function formatMoney(cents: number, currency: Currency, locale: Locale): string {
  const cacheKey = `${locale}|${currency}`;
  let formatter = formatters.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    formatters.set(cacheKey, formatter);
  }
  // All supported currencies use two decimal places, so cents / 100 is exact enough to display.
  return formatter.format(cents / 100);
}

/** The localized name of a currency, e.g. "Brazilian real" or "real brasileño". */
export function currencyName(currency: Currency, locale: Locale): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'currency' }).of(currency) ?? currency;
  } catch {
    return currency;
  }
}
