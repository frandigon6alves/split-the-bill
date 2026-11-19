import { describe, expect, it } from 'vitest';
import { EXACT_SEARCH_LIMIT, settle, settleGreedily } from './settle';
import type { Transfer } from './types';

const balancesOf = (record: Record<string, number>) => new Map(Object.entries(record));

/** Applies the transfers to the balances and returns what is left. */
function apply(record: Record<string, number>, transfers: Transfer[]) {
  const left = { ...record };
  for (const { from, to, amountCents } of transfers) {
    left[from] = (left[from] ?? 0) + amountCents;
    left[to] = (left[to] ?? 0) - amountCents;
  }
  return left;
}

function expectSettled(record: Record<string, number>, transfers: Transfer[]) {
  for (const value of Object.values(apply(record, transfers))) expect(value).toBe(0);
  for (const transfer of transfers) {
    expect(transfer.amountCents).toBeGreaterThan(0);
    expect(Number.isInteger(transfer.amountCents)).toBe(true);
    expect(transfer.from).not.toBe(transfer.to);
  }
}

/** Deterministic pseudo-random generator so failures are reproducible. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    return state / 2 ** 31;
  };
}

function randomBalances(count: number, random: () => number): Record<string, number> {
  const record: Record<string, number> = {};
  let sum = 0;
  for (let i = 0; i < count - 1; i++) {
    const cents = Math.round((random() - 0.5) * 20000);
    record[`p${i}`] = cents;
    sum += cents;
  }
  record[`p${count - 1}`] = -sum;
  return record;
}

describe('settle', () => {
  it('returns nothing when there are no balances', () => {
    expect(settle(new Map())).toEqual([]);
  });

  it('returns nothing when everyone is already even', () => {
    expect(settle(balancesOf({ a: 0, b: 0, c: 0 }))).toEqual([]);
  });

  it('settles two people with a single payment', () => {
    expect(settle(balancesOf({ a: 1500, b: -1500 }))).toEqual([
      { from: 'b', to: 'a', amountCents: 1500 },
    ]);
  });

  it('ignores people with a zero balance', () => {
    const transfers = settle(balancesOf({ a: 1000, b: 0, c: -1000 }));
    expect(transfers).toEqual([{ from: 'c', to: 'a', amountCents: 1000 }]);
  });

  it('handles one payer and many debtors', () => {
    const record = { a: 3000, b: -1000, c: -1000, d: -1000 };
    const transfers = settle(balancesOf(record));
    expect(transfers).toHaveLength(3);
    expect(transfers.every((t) => t.to === 'a')).toBe(true);
    expectSettled(record, transfers);
  });

  it('settles odd cents left over from uneven splits', () => {
    // 10.00 paid by c, split three ways: 3.34 / 3.33 / 3.33
    const record = { a: -334, b: -333, c: 667 };
    const transfers = settle(balancesOf(record));
    expect(transfers).toEqual([
      { from: 'a', to: 'c', amountCents: 334 },
      { from: 'b', to: 'c', amountCents: 333 },
    ]);
  });

  it('finds fewer payments than the plain greedy approach when sub-groups cancel out', () => {
    // {a, d} cancel out and {b, c, e} cancel out, so 1 + 2 = 3 payments are enough.
    const record = { a: 400, b: 300, c: 300, d: -400, e: -600 };
    const greedy = settleGreedily(Object.entries(record).map(([id, cents]) => ({ id, cents })));
    expect(greedy).toHaveLength(4);

    const transfers = settle(balancesOf(record));
    expect(transfers).toHaveLength(3);
    expect(transfers).toContainEqual({ from: 'd', to: 'a', amountCents: 400 });
    expectSettled(record, transfers);
  });

  it('pairs exactly matching debts and credits', () => {
    const record = { a: 500, b: 700, c: 900, d: -900, e: -700, f: -500 };
    const transfers = settle(balancesOf(record));
    expect(transfers).toHaveLength(3);
    expectSettled(record, transfers);
  });

  it('is deterministic', () => {
    const record = { a: 1234, b: -234, c: -500, d: -500 };
    expect(settle(balancesOf(record))).toEqual(settle(balancesOf(record)));
  });

  it('never needs more than n - 1 payments for random groups', () => {
    const random = seeded(42);
    for (let round = 0; round < 50; round++) {
      const count = 2 + Math.floor(random() * 10);
      const record = randomBalances(count, random);
      const transfers = settle(balancesOf(record));
      expectSettled(record, transfers);
      const nonZero = Object.values(record).filter((v) => v !== 0).length;
      expect(transfers.length).toBeLessThanOrEqual(Math.max(0, nonZero - 1));
    }
  });

  it('uses the exact search up to the limit', () => {
    // Eight pairs that cancel each other out: the optimum is 8 payments, not 15.
    const record: Record<string, number> = {};
    for (let i = 0; i < EXACT_SEARCH_LIMIT / 2; i++) {
      record[`c${i}`] = (i + 1) * 100;
      record[`d${i}`] = -(i + 1) * 100;
    }
    const transfers = settle(balancesOf(record));
    expect(transfers).toHaveLength(EXACT_SEARCH_LIMIT / 2);
    expectSettled(record, transfers);
  });

  it('falls back to the greedy strategy for large groups', () => {
    const record = randomBalances(60, seeded(7));
    const transfers = settle(balancesOf(record));
    expectSettled(record, transfers);
    expect(transfers.length).toBeLessThanOrEqual(59);
  });

  it('rejects balances that do not add up to zero', () => {
    expect(() => settle(balancesOf({ a: 100, b: -99 }))).toThrow(/zero/);
  });

  it('rejects fractional cents', () => {
    expect(() => settle(balancesOf({ a: 0.5, b: -0.5 }))).toThrow(RangeError);
  });
});
