import { isValidCents } from './money';
import type { Expense, PersonId } from './types';

/**
 * Divides `totalCents` evenly between `participants`.
 *
 * Integer division leaves a remainder of up to `participants.length - 1` cents. Those cents are
 * handed out one at a time to the first participants in the given order, so the shares always add
 * up to exactly `totalCents` and never differ from each other by more than one cent.
 */
export function splitEvenly(
  totalCents: number,
  participants: readonly PersonId[],
): Map<PersonId, number> {
  if (!isValidCents(totalCents)) {
    throw new RangeError(`Total must be a non-negative integer number of cents, got ${totalCents}`);
  }
  if (participants.length === 0) {
    throw new RangeError('Cannot split an amount between zero participants');
  }
  if (new Set(participants).size !== participants.length) {
    throw new RangeError('Participants must be unique');
  }

  const base = Math.floor(totalCents / participants.length);
  const remainder = totalCents - base * participants.length;
  return new Map(participants.map((id, index) => [id, base + (index < remainder ? 1 : 0)]));
}

/** Returns how much each person owes for a single expense, in cents. */
export function sharesOf(expense: Expense): Map<PersonId, number> {
  const { split } = expense;
  if (split.kind === 'equal') {
    return splitEvenly(expense.amountCents, split.participants);
  }
  const shares = new Map<PersonId, number>();
  let sum = 0;
  for (const [id, cents] of Object.entries(split.shares)) {
    if (!isValidCents(cents)) {
      throw new RangeError(`Share for ${id} must be a non-negative integer, got ${cents}`);
    }
    if (cents > 0) shares.set(id, cents);
    sum += cents;
  }
  if (sum !== expense.amountCents) {
    throw new RangeError(`Custom shares add up to ${sum}, expected ${expense.amountCents}`);
  }
  return shares;
}

export type ExpenseError =
  | 'description-empty'
  | 'amount-invalid'
  | 'payer-unknown'
  | 'participants-empty'
  | 'participant-unknown'
  | 'share-invalid'
  | 'shares-mismatch';

/** Checks an expense against the current group. Returns an empty array when it is valid. */
export function validateExpense(
  expense: Expense,
  knownPeople: ReadonlySet<PersonId>,
): ExpenseError[] {
  const errors: ExpenseError[] = [];
  if (expense.description.trim() === '') errors.push('description-empty');
  if (!isValidCents(expense.amountCents) || expense.amountCents === 0) {
    errors.push('amount-invalid');
  }
  if (!knownPeople.has(expense.paidBy)) errors.push('payer-unknown');

  const { split } = expense;
  if (split.kind === 'equal') {
    if (split.participants.length === 0) errors.push('participants-empty');
    if (split.participants.some((id) => !knownPeople.has(id))) errors.push('participant-unknown');
    return errors;
  }

  const entries = Object.entries(split.shares);
  if (entries.some(([id]) => !knownPeople.has(id))) errors.push('participant-unknown');
  if (entries.some(([, cents]) => !isValidCents(cents))) {
    errors.push('share-invalid');
    return errors;
  }
  if (entries.every(([, cents]) => cents === 0)) errors.push('participants-empty');
  const sum = entries.reduce((total, [, cents]) => total + cents, 0);
  if (sum !== expense.amountCents) errors.push('shares-mismatch');
  return errors;
}
