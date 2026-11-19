export type PersonId = string;

export interface Person {
  id: PersonId;
  name: string;
}

/**
 * How an expense is shared.
 * - `equal`: the amount is divided evenly between `participants`.
 * - `custom`: each person owes an explicit amount in cents; the shares must add up to the total.
 */
export type Split =
  | { kind: 'equal'; participants: PersonId[] }
  | { kind: 'custom'; shares: Record<PersonId, number> };

export interface Expense {
  id: string;
  description: string;
  /** Total amount in integer cents (minor units). */
  amountCents: number;
  paidBy: PersonId;
  split: Split;
}

/** A single payment that moves `amountCents` from `from` to `to`. */
export interface Transfer {
  from: PersonId;
  to: PersonId;
  amountCents: number;
}

/** Net position per person: positive means they are owed money, negative means they owe. */
export type Balances = ReadonlyMap<PersonId, number>;
