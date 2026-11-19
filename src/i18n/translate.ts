import { catalogues, type Locale, type MessageKey } from './locales';
import type { Message, MessageParams } from './types';

export type Translate = (key: MessageKey, params?: MessageParams) => string;

const PLACEHOLDER = /\{(\w+)\}/g;

function interpolate(template: string, params: MessageParams, locale: Locale): string {
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = params[name];
    if (value === undefined) return match;
    return typeof value === 'number' ? new Intl.NumberFormat(locale).format(value) : value;
  });
}

function select(message: Message, params: MessageParams, locale: Locale): string {
  if (typeof message === 'string') return message;
  const count = params.count;
  if (typeof count !== 'number') {
    throw new TypeError('Plural messages need a numeric "count" parameter');
  }
  const category = new Intl.PluralRules(locale).select(count);
  return message[category] ?? message.other;
}

export function createTranslator(locale: Locale): Translate {
  const catalogue = catalogues[locale];
  return (key, params = {}) => interpolate(select(catalogue[key], params, locale), params, locale);
}

/** Lists the `{placeholder}` names used by a message, across all of its plural forms. */
export function placeholdersOf(message: Message): string[] {
  const forms = typeof message === 'string' ? [message] : Object.values(message);
  const names = new Set<string>();
  for (const form of forms) {
    for (const match of form.matchAll(PLACEHOLDER)) if (match[1]) names.add(match[1]);
  }
  return [...names].sort();
}
