import { describe, expect, it } from 'vitest';
import { computeBalances, totalSpent } from './balances';
import type { Expense, Person } from './types';

const people: Person[] = [
  { id: 'ana', name: 'Ana' },
  { id: 'bruno', name: 'Bruno' },
  { id: 'carla', name: 'Carla' },
];

const expense = (overrides: Partial<Expense>): Expense => ({
  id: 'e',
  description: 'Expense',
  amountCents: 0,
  paidBy: 'ana',
  split: { kind: 'equal', participants: ['ana', 'bruno', 'carla'] },
  ...overrides,
});

const total = (balances: ReadonlyMap<string, number>) =>
  [...balances.values()].reduce((a, b) => a + b, 0);

describe('computeBalances', () => {
  it('starts everyone at zero', () => {
    expect(Object.fromEntries(computeBalances(people, []))).toEqual({ ana: 0, bruno: 0, carla: 0 });
  });

  it('credits the payer and debits each share', () => {
    const balances = computeBalances(people, [expense({ amountCents: 3000 })]);
    expect(Object.fromEntries(balances)).toEqual({ ana: 2000, bruno: -1000, carla: -1000 });
  });

  it('keeps remainder cents so balances still add up to zero', () => {
    const balances = computeBalances(people, [expense({ amountCents: 1000, paidBy: 'carla' })]);
    expect(Object.fromEntries(balances)).toEqual({ ana: -334, bruno: -333, carla: 667 });
    expect(total(balances)).toBe(0);
  });

  it('combines equal and custom splits', () => {
    const balances = computeBalances(people, [
      expense({ amountCents: 6000 }),
      expense({
        amountCents: 2500,
        paidBy: 'bruno',
        split: { kind: 'custom', shares: { ana: 500, carla: 2000 } },
      }),
    ]);
    expect(Object.fromEntries(balances)).toEqual({ ana: 3500, bruno: 500, carla: -4000 });
  });

  it('lets someone pay for an expense they do not share', () => {
    const balances = computeBalances(people, [
      expense({ amountCents: 1000, split: { kind: 'equal', participants: ['bruno', 'carla'] } }),
    ]);
    expect(Object.fromEntries(balances)).toEqual({ ana: 1000, bruno: -500, carla: -500 });
  });

  it('returns zero for someone who paid exactly their share', () => {
    const balances = computeBalances(people, [
      expense({ amountCents: 900 }),
      expense({ amountCents: 900, paidBy: 'bruno' }),
      expense({ amountCents: 900, paidBy: 'carla' }),
    ]);
    expect(Object.fromEntries(balances)).toEqual({ ana: 0, bruno: 0, carla: 0 });
  });
});

describe('totalSpent', () => {
  it('adds up all expenses', () => {
    expect(totalSpent([expense({ amountCents: 150 }), expense({ amountCents: 275 })])).toBe(425);
  });
});
