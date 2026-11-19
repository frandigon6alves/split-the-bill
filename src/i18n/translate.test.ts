import { describe, expect, it } from 'vitest';
import { currencyName, formatMoney } from './format';
import { isLocale, matchLocale } from './locales';
import { createTranslator, placeholdersOf } from './translate';

describe('createTranslator', () => {
  it('interpolates named parameters', () => {
    const t = createTranslator('en');
    expect(t('people.remove', { name: 'Ana' })).toBe('Remove Ana');
  });

  it('follows each language’s word order', () => {
    const params = { from: 'Ana', to: 'Bruno', amount: '€10.00' };
    expect(createTranslator('en')('settle.pays', params)).toBe('Ana pays Bruno €10.00');
    expect(createTranslator('es')('settle.pays', params)).toBe('Ana paga €10.00 a Bruno');
    expect(createTranslator('pt-BR')('settle.pays', params)).toBe('Ana paga €10.00 para Bruno');
  });

  it('picks plural forms with Intl.PluralRules', () => {
    const en = createTranslator('en');
    expect(en('people.count', { count: 1 })).toBe('1 person');
    expect(en('people.count', { count: 2 })).toBe('2 people');
    expect(en('people.count', { count: 0 })).toBe('0 people');

    const pt = createTranslator('pt-BR');
    expect(pt('settle.summary', { count: 1 })).toBe('1 pagamento resolve tudo.');
    expect(pt('settle.summary', { count: 3 })).toBe('3 pagamentos resolvem tudo.');
    // Portuguese treats 0 as singular, unlike English.
    expect(pt('people.count', { count: 0 })).toBe('0 pessoa');

    const es = createTranslator('es');
    expect(es('expenses.count', { count: 1 })).toBe('1 gasto');
    expect(es('expenses.count', { count: 5 })).toBe('5 gastos');
  });

  it('formats numeric parameters for the locale', () => {
    expect(createTranslator('en')('people.count', { count: 1200 })).toBe('1,200 people');
    expect(createTranslator('pt-BR')('people.count', { count: 1200 })).toBe('1.200 pessoas');
  });

  it('falls back to the "other" form for categories a message does not define', () => {
    // Spanish uses "many" for round millions; the catalogue only defines one/other.
    expect(createTranslator('es')('people.count', { count: 1_000_000 })).toBe('1.000.000 personas');
  });

  it('requires a count for plural messages', () => {
    expect(() => createTranslator('en')('people.count')).toThrow(TypeError);
  });
});

describe('placeholdersOf', () => {
  it('collects placeholders across plural forms', () => {
    expect(placeholdersOf({ one: '{count} item', other: '{count} items for {name}' })).toEqual([
      'count',
      'name',
    ]);
  });
});

describe('matchLocale', () => {
  it.each([
    [['pt-BR'], 'pt-BR'],
    [['pt-PT'], 'pt-BR'],
    [['pt'], 'pt-BR'],
    [['es-MX', 'en'], 'es'],
    [['fr-FR', 'es'], 'es'],
    [['EN-gb'], 'en'],
    [['de'], 'en'],
    [[], 'en'],
  ])('maps %j to %s', (requested, expected) => {
    expect(matchLocale(requested)).toBe(expected);
  });

  it('recognises supported locales', () => {
    expect(isLocale('pt-BR')).toBe(true);
    expect(isLocale('pt')).toBe(false);
  });
});

describe('formatMoney', () => {
  // Intl may use non-breaking spaces; normalise them so the assertions stay readable.
  const plain = (text: string) => text.replace(/\s/g, ' ');

  it('formats cents for each locale and currency', () => {
    expect(formatMoney(123456, 'USD', 'en')).toBe('$1,234.56');
    expect(plain(formatMoney(123456, 'BRL', 'pt-BR'))).toBe('R$ 1.234,56');
    expect(plain(formatMoney(123456, 'EUR', 'es'))).toBe('1234,56 €');
    expect(plain(formatMoney(5, 'EUR', 'en'))).toBe('€0.05');
  });

  it('names currencies in the active language', () => {
    expect(currencyName('BRL', 'en')).toBe('Brazilian Real');
    expect(currencyName('EUR', 'pt-BR')).toBe('Euro');
  });
});
