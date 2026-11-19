import type { Expense, Person, PersonId } from '../domain';
import { isCurrency, type Currency } from '../i18n/format';
import { readStorage, writeStorage } from './storage';

export interface GroupState {
  name: string;
  currency: Currency;
  people: Person[];
  expenses: Expense[];
}

export type GroupAction =
  | { type: 'rename'; name: string }
  | { type: 'setCurrency'; currency: Currency }
  | { type: 'addPerson'; person: Person }
  | { type: 'removePerson'; id: PersonId }
  | { type: 'addExpense'; expense: Expense }
  | { type: 'removeExpense'; id: string }
  | { type: 'reset' };

export function emptyGroup(currency: Currency): GroupState {
  return { name: '', currency, people: [], expenses: [] };
}

/** Whether the person paid for or shares any expense (and therefore cannot be removed). */
export function isInvolved(state: GroupState, id: PersonId): boolean {
  return state.expenses.some((expense) => {
    if (expense.paidBy === id) return true;
    return expense.split.kind === 'equal'
      ? expense.split.participants.includes(id)
      : (expense.split.shares[id] ?? 0) > 0;
  });
}

export function groupReducer(state: GroupState, action: GroupAction): GroupState {
  switch (action.type) {
    case 'rename':
      return { ...state, name: action.name };
    case 'setCurrency':
      return { ...state, currency: action.currency };
    case 'addPerson':
      return { ...state, people: [...state.people, action.person] };
    case 'removePerson':
      if (isInvolved(state, action.id)) return state;
      return { ...state, people: state.people.filter((person) => person.id !== action.id) };
    case 'addExpense':
      return { ...state, expenses: [...state.expenses, action.expense] };
    case 'removeExpense':
      return { ...state, expenses: state.expenses.filter((expense) => expense.id !== action.id) };
    case 'reset':
      return emptyGroup(state.currency);
  }
}

export const GROUP_STORAGE_KEY = 'split-the-bill:group:v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCents = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

function isPerson(value: unknown): value is Person {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string';
}

function isExpense(value: unknown): value is Expense {
  if (!isRecord(value)) return false;
  const { id, description, amountCents, paidBy, split } = value;
  if (typeof id !== 'string' || typeof description !== 'string' || typeof paidBy !== 'string') {
    return false;
  }
  if (!isCents(amountCents) || !isRecord(split)) return false;
  if (split.kind === 'equal') {
    return (
      Array.isArray(split.participants) &&
      split.participants.length > 0 &&
      split.participants.every((p) => typeof p === 'string')
    );
  }
  if (split.kind === 'custom' && isRecord(split.shares)) {
    const shares = Object.values(split.shares);
    return shares.every(isCents) && shares.reduce((a, b) => a + b, 0) === amountCents;
  }
  return false;
}

/**
 * Restores a saved group. Anything missing, malformed or referring to unknown people is
 * discarded rather than trusted, so a corrupted entry can never crash the app.
 */
export function parseGroup(raw: string | null): GroupState | null {
  if (raw === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || !isCurrency(data.currency)) return null;
  if (!Array.isArray(data.people) || !Array.isArray(data.expenses)) return null;

  const people = data.people.filter(isPerson);
  const known = new Set(people.map((person) => person.id));
  const expenses = data.expenses.filter(isExpense).filter((expense) => {
    const ids =
      expense.split.kind === 'equal'
        ? expense.split.participants
        : Object.keys(expense.split.shares);
    return known.has(expense.paidBy) && ids.every((id) => known.has(id));
  });

  return {
    name: typeof data.name === 'string' ? data.name : '',
    currency: data.currency,
    people,
    expenses,
  };
}

export function loadGroup(): GroupState | null {
  return parseGroup(readStorage(GROUP_STORAGE_KEY));
}

export function saveGroup(state: GroupState): void {
  writeStorage(GROUP_STORAGE_KEY, JSON.stringify(state));
}
