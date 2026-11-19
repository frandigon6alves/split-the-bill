import { describe, expect, it } from 'vitest';
import { catalogues, LOCALES } from './locales';
import { placeholdersOf } from './translate';

const english = catalogues.en;
const englishKeys = Object.keys(english).sort();

describe.each(LOCALES.filter((locale) => locale !== 'en'))('the %s catalogue', (locale) => {
  const catalogue = catalogues[locale];

  it('has exactly the same keys as English', () => {
    expect(Object.keys(catalogue).sort()).toEqual(englishKeys);
  });

  it('uses the same placeholders as English for every message', () => {
    for (const key of englishKeys) {
      const k = key as keyof typeof english;
      expect({ key, placeholders: placeholdersOf(catalogue[k]) }).toEqual({
        key,
        placeholders: placeholdersOf(english[k]),
      });
    }
  });
});

describe.each(LOCALES)('the %s catalogue', (locale) => {
  const catalogue = catalogues[locale];
  const categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;

  it('has no empty messages', () => {
    for (const [key, message] of Object.entries(catalogue)) {
      const forms = typeof message === 'string' ? [message] : Object.values(message);
      for (const form of forms) expect({ key, form: form.trim() }).not.toEqual({ key, form: '' });
    }
  });

  it('only uses plural categories that exist in the language', () => {
    for (const [key, message] of Object.entries(catalogue)) {
      if (typeof message === 'string') continue;
      expect(message.other, key).toBeTypeOf('string');
      for (const category of Object.keys(message)) {
        expect(categories, `${key}.${category}`).toContain(category);
      }
    }
  });
});
