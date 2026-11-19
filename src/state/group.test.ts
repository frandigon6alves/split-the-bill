import { describe, expect, it } from 'vitest';
import type { Expense } from '../domain';
import {
  emptyGroup,
  GROUP_STORAGE_KEY,
  groupReducer,
  isInvolved,
  loadGroup,
  parseGroup,
  saveGroup,
  type GroupState,
} from './group';

const expense: Expense = {
  id: 'e1',
  description: 'Dinner',
  amountCents: 3000,
  paidBy: 'a',
  split: { kind: 'equal', participants: ['a', 'b'] },
};

const state: GroupState = {
  name: 'Trip',
  currency: 'EUR',
  people: [
    { id: 'a', name: 'Ana' },
    { id: 'b', name: 'Bruno' },
    { id: 'c', name: 'Carla' },
  ],
  expenses: [expense],
};

describe('groupReducer', () => {
  it('adds and removes people who are not part of any expense', () => {
    const added = groupReducer(state, { type: 'addPerson', person: { id: 'd', name: 'Dani' } });
    expect(added.people).toHaveLength(4);
    expect(groupReducer(added, { type: 'removePerson', id: 'd' }).people).toHaveLength(3);
  });

  it('refuses to remove someone involved in an expense', () => {
    expect(groupReducer(state, { type: 'removePerson', id: 'b' })).toBe(state);
    expect(isInvolved(state, 'a')).toBe(true);
    expect(isInvolved(state, 'c')).toBe(false);
  });

  it('resets everything but the currency', () => {
    expect(groupReducer(state, { type: 'reset' })).toEqual(emptyGroup('EUR'));
  });
});

describe('persistence', () => {
  it('round-trips through localStorage', () => {
    saveGroup(state);
    expect(loadGroup()).toEqual(state);
  });

  it('returns null when nothing is stored or the data is unreadable', () => {
    expect(loadGroup()).toBeNull();
    expect(parseGroup('{not json')).toBeNull();
    expect(parseGroup(JSON.stringify({ currency: 'GBP', people: [], expenses: [] }))).toBeNull();
  });

  it('drops malformed entries instead of crashing', () => {
    const raw = JSON.stringify({
      ...state,
      people: [...state.people, { id: 42 }],
      expenses: [
        expense,
        { ...expense, id: 'e2', paidBy: 'ghost' },
        { ...expense, id: 'e3', amountCents: 1.5 },
        { ...expense, id: 'e4', split: { kind: 'custom', shares: { a: 100 } } },
      ],
    });
    expect(parseGroup(raw)).toEqual(state);
  });

  it('survives storage that throws', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      },
    });
    try {
      expect(() => {
        saveGroup(state);
      }).not.toThrow();
      expect(loadGroup()).toBeNull();
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
    expect(window.localStorage.getItem(GROUP_STORAGE_KEY)).toBeNull();
  });
});
