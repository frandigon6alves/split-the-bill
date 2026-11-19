import { describe, expect, it } from 'vitest';
import { centsToDecimalString, parseAmountToCents } from './money';

describe('parseAmountToCents', () => {
  it.each([
    ['12', 1200],
    ['12.5', 1250],
    ['12.50', 1250],
    ['12,50', 1250],
    ['0.01', 1],
    [' 7 ', 700],
    ['1 000', 100000],
    ['0', 0],
  ])('parses %j as %i cents', (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected);
  });

  it.each(['', 'abc', '-5', '1.234', '1,2,3', '12.', '.5', '1e3', '12.345'])(
    'rejects %j',
    (input) => {
      expect(parseAmountToCents(input)).toBeNull();
    },
  );

  it('avoids floating point drift', () => {
    expect(parseAmountToCents('0.29')).toBe(29);
    expect(parseAmountToCents('1.15')).toBe(115);
  });

  it('rejects amounts beyond the safe integer range', () => {
    expect(parseAmountToCents('99999999999999999999')).toBeNull();
  });
});

describe('centsToDecimalString', () => {
  it('formats with two decimals', () => {
    expect(centsToDecimalString(1234)).toBe('12.34');
    expect(centsToDecimalString(5)).toBe('0.05');
    expect(centsToDecimalString(-250)).toBe('-2.50');
  });
});
