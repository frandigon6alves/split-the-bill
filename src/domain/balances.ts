import { sharesOf } from './split';
import type { Balances, Expense, Person, PersonId } from './types';

/**
 * Computes each person's net balance in cents: what they paid minus what they owe.
 * The balances of a group always add up to zero.
 */
export function computeBalances(people: readonly Person[], expenses: readonly Expense[]): Balances {
  const balances = new Map<PersonId, number>(people.map((person) => [person.id, 0]));
  const add = (id: PersonId, cents: number) => {
    balances.set(id, (balances.get(id) ?? 0) + cents);
  };

  for (const expense of expenses) {
    add(expense.paidBy, expense.amountCents);
    for (const [id, share] of sharesOf(expense)) add(id, -share);
  }
  return balances;
}

/** Sum of all expense amounts in cents. */
export function totalSpent(expenses: readonly Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amountCents, 0);
}
