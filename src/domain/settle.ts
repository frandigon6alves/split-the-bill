import type { Balances, PersonId, Transfer } from './types';

/**
 * Above this many people with a non-zero balance we skip the exact search (which is exponential)
 * and fall back to the greedy strategy, which still needs at most n - 1 payments.
 */
export const EXACT_SEARCH_LIMIT = 16;

interface Entry {
  id: PersonId;
  cents: number;
}

/**
 * Returns a list of payments that brings every balance to zero, using as few payments as possible.
 *
 * Any set of payments splits the group into connected clusters, and each cluster's balances must
 * add up to zero. A cluster of k people needs at least k - 1 payments, so the minimum number of
 * payments is `n - g`, where `g` is the largest number of disjoint zero-sum groups the balances can
 * be partitioned into. We find that partition with a dynamic programme over subsets, then settle
 * each group greedily (largest debtor pays largest creditor), which uses exactly k - 1 payments
 * per group of k people.
 */
export function settle(balances: Balances): Transfer[] {
  const entries: Entry[] = [];
  let total = 0;
  for (const [id, cents] of balances) {
    if (!Number.isSafeInteger(cents)) {
      throw new RangeError(`Balance for ${id} must be an integer number of cents, got ${cents}`);
    }
    total += cents;
    if (cents !== 0) entries.push({ id, cents });
  }
  if (total !== 0) {
    throw new RangeError(`Balances must add up to zero, got ${total}`);
  }

  const groups =
    entries.length <= EXACT_SEARCH_LIMIT ? partitionIntoZeroSumGroups(entries) : [entries];
  return groups.flatMap(settleGreedily);
}

/**
 * Splits entries (which add up to zero) into the maximum number of disjoint zero-sum groups.
 *
 * best[mask] = max over i in mask of best[mask without i], plus one if mask itself sums to zero.
 * Walking back along the choices, every time the remaining set sums to zero we close a group.
 * Runs in O(2^n * n) time and O(2^n) memory.
 */
export function partitionIntoZeroSumGroups(entries: readonly Entry[]): Entry[][] {
  const n = entries.length;
  if (n === 0) return [];
  if (n > 24) throw new RangeError(`Too many entries for an exact search: ${n}`);
  const size = 1 << n;
  const sums = new Float64Array(size);
  const best = new Int8Array(size);

  for (let mask = 1; mask < size; mask++) {
    const lowest = 31 - Math.clz32(mask & -mask);
    sums[mask] = (sums[mask & (mask - 1)] ?? 0) + (entries[lowest]?.cents ?? 0);

    let max = -1;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) max = Math.max(max, best[mask ^ (1 << i)] ?? 0);
    }
    best[mask] = max + (sums[mask] === 0 ? 1 : 0);
  }

  const groups: Entry[][] = [];
  let current: Entry[] = [];
  let mask = size - 1;
  while (mask !== 0) {
    let pick = -1;
    for (let i = 0; i < n; i++) {
      if (!(mask & (1 << i))) continue;
      if (pick === -1 || (best[mask ^ (1 << i)] ?? 0) > (best[mask ^ (1 << pick)] ?? 0)) pick = i;
    }
    const entry = entries[pick];
    if (entry) current.push(entry);
    mask ^= 1 << pick;
    if (sums[mask] === 0) {
      groups.push(current);
      current = [];
    }
  }
  return groups;
}

/**
 * Settles a zero-sum group by repeatedly matching the largest debtor with the largest creditor.
 * Each payment clears at least one person, so a group of k people needs at most k - 1 payments.
 * Ties keep the original order, which makes the output deterministic.
 */
export function settleGreedily(group: readonly Entry[]): Transfer[] {
  const creditors = group.filter((e) => e.cents > 0).map((e) => ({ ...e }));
  const debtors = group.filter((e) => e.cents < 0).map((e) => ({ id: e.id, cents: -e.cents }));
  const transfers: Transfer[] = [];

  const byLargest = (a: Entry, b: Entry) => b.cents - a.cents;
  creditors.sort(byLargest);
  debtors.sort(byLargest);

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    if (!creditor || !debtor) break;
    const amount = Math.min(creditor.cents, debtor.cents);
    transfers.push({ from: debtor.id, to: creditor.id, amountCents: amount });
    creditor.cents -= amount;
    debtor.cents -= amount;
    if (creditor.cents === 0) creditors.shift();
    if (debtor.cents === 0) debtors.shift();
    creditors.sort(byLargest);
    debtors.sort(byLargest);
  }
  return transfers;
}
