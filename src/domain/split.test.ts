import { describe, expect, it } from 'vitest';
import { sharesOf, splitEvenly, validateExpense } from './split';
import type { Expense } from './types';

const sum = (map: Map<string, number>) => [...map.values()].reduce((a, b) => a + b, 0);

describe('splitEvenly', () => {
  it('splits an exact amount equally', () => {
    expect(Object.fromEntries(splitEvenly(900, ['a', 'b', 'c']))).toEqual({
      a: 300,
      b: 300,
      c: 300,
    });
  });

  it('gives the remainder cents to the first participants, one each', () => {
    expect(Object.fromEntries(splitEvenly(1000, ['a', 'b', 'c']))).toEqual({
      a: 334,
      b: 333,
      c: 333,
    });
    expect(Object.fromEntries(splitEvenly(1001, ['a', 'b', 'c']))).toEqual({
      a: 334,
      b: 334,
      c: 333,
    });
  });

  it('handles amounts smaller than the number of participants', () => {
    expect(Object.fromEntries(splitEvenly(2, ['a', 'b', 'c', 'd']))).toEqual({
      a: 1,
      b: 1,
      c: 0,
      d: 0,
    });
  });

  it('always adds up to the total and never differs by more than one cent', () => {
    for (let total = 0; total < 500; total += 7) {
      for (let n = 1; n <= 9; n++) {
        const ids = Array.from({ length: n }, (_, i) => `p${i}`);
        const shares = splitEvenly(total, ids);
        expect(sum(shares)).toBe(total);
        const values = [...shares.values()];
        expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('rejects invalid input', () => {
    expect(() => splitEvenly(100, [])).toThrow(RangeError);
    expect(() => splitEvenly(10.5, ['a'])).toThrow(RangeError);
    expect(() => splitEvenly(-1, ['a'])).toThrow(RangeError);
    expect(() => splitEvenly(100, ['a', 'a'])).toThrow(RangeError);
  });
});

describe('sharesOf', () => {
  it('uses explicit amounts for custom splits and drops zero shares', () => {
    const expense: Expense = {
      id: 'e1',
      description: 'Groceries',
      amountCents: 5000,
      paidBy: 'a',
      split: { kind: 'custom', shares: { a: 1000, b: 4000, c: 0 } },
    };
    expect(Object.fromEntries(sharesOf(expense))).toEqual({ a: 1000, b: 4000 });
  });

  it('throws when custom shares do not add up to the total', () => {
    const expense: Expense = {
      id: 'e1',
      description: 'Groceries',
      amountCents: 5000,
      paidBy: 'a',
      split: { kind: 'custom', shares: { a: 1000, b: 3999 } },
    };
    expect(() => sharesOf(expense)).toThrow(/4999/);
  });
});

describe('validateExpense', () => {
  const people = new Set(['a', 'b']);
  const base: Expense = {
    id: 'e1',
    description: 'Taxi',
    amountCents: 1200,
    paidBy: 'a',
    split: { kind: 'equal', participants: ['a', 'b'] },
  };

  it('accepts a valid expense', () => {
    expect(validateExpense(base, people)).toEqual([]);
  });

  it('reports every problem it finds', () => {
    expect(
      validateExpense(
        {
          ...base,
          description: '  ',
          amountCents: 0,
          paidBy: 'z',
          split: { kind: 'equal', participants: [] },
        },
        people,
      ),
    ).toEqual(['description-empty', 'amount-invalid', 'payer-unknown', 'participants-empty']);
  });

  it('flags unknown participants', () => {
    expect(
      validateExpense({ ...base, split: { kind: 'equal', participants: ['a', 'x'] } }, people),
    ).toEqual(['participant-unknown']);
  });

  it('checks that custom shares add up', () => {
    expect(
      validateExpense({ ...base, split: { kind: 'custom', shares: { a: 200, b: 900 } } }, people),
    ).toEqual(['shares-mismatch']);
    expect(
      validateExpense({ ...base, split: { kind: 'custom', shares: { a: 0, b: 0 } } }, people),
    ).toEqual(['participants-empty', 'shares-mismatch']);
    expect(
      validateExpense({ ...base, split: { kind: 'custom', shares: { a: -1, b: 1201 } } }, people),
    ).toEqual(['share-invalid']);
  });
});
