import type { Message } from '../types';

/**
 * The English catalogue is the source of truth: its keys define `MessageKey`, and every other
 * locale must provide exactly the same keys (enforced by the type checker and by a unit test).
 *
 * Placeholders use `{name}`. Plural messages are objects keyed by CLDR plural category and
 * receive a numeric `{count}`.
 */
export const en = {
  'app.title': 'Split the bill',
  'app.tagline': 'Share costs fairly, then settle up with as few payments as possible.',
  'settings.label': 'Settings',
  'settings.language': 'Language',
  'settings.currency': 'Currency',
  'group.nameLabel': 'Group name',
  'group.namePlaceholder': 'e.g. Lisbon trip',
  'group.reset': 'Start over',
  'group.resetConfirm': 'Remove all people and expenses? This cannot be undone.',

  'people.heading': 'People',
  'people.nameLabel': 'Name',
  'people.namePlaceholder': 'e.g. Ana',
  'people.add': 'Add person',
  'people.remove': 'Remove {name}',
  'people.empty': 'Add the people sharing costs to get started.',
  'people.count': { one: '{count} person', other: '{count} people' },
  'people.error.empty': 'Enter a name.',
  'people.error.duplicate': '{name} is already in the group.',
  'people.error.inUse': '{name} is part of an expense. Delete those expenses first.',

  'expense.heading': 'Add an expense',
  'expense.needPeople': 'Add at least one person before adding expenses.',
  'expense.description': 'Description',
  'expense.descriptionPlaceholder': 'e.g. Dinner',
  'expense.amount': 'Amount',
  'expense.paidBy': 'Paid by',
  'expense.splitMode': 'Split',
  'expense.splitEqual': 'Equally',
  'expense.splitCustom': 'Custom amounts',
  'expense.participants': 'Shared by',
  'expense.shareFor': 'Share for {name}',
  'expense.remaining': '{amount} left to assign',
  'expense.over': '{amount} more than the total',
  'expense.balanced': 'Shares add up to the total',
  'expense.add': 'Add expense',
  'expense.added': 'Added “{description}”.',
  'expense.error.description': 'Enter a description.',
  'expense.error.amount': 'Enter an amount greater than zero, like 12.50.',
  'expense.error.participants': 'Pick at least one person to share it.',
  'expense.error.share': 'Enter a valid amount for every share.',
  'expense.error.shares': 'Custom shares must add up to the total.',

  'expenses.heading': 'Expenses',
  'expenses.empty': 'No expenses yet.',
  'expenses.count': { one: '{count} expense', other: '{count} expenses' },
  'expenses.total': 'Total spent: {amount}',
  'expenses.paidBy': '{name} paid {amount}',
  'expenses.sharedBy': { one: 'for {count} person', other: 'split between {count} people' },
  'expenses.remove': 'Delete “{description}”',

  'balances.heading': 'Balances',
  'balances.empty': 'Balances appear once people are added.',
  'balances.getsBack': 'gets back {amount}',
  'balances.owes': 'owes {amount}',
  'balances.even': 'is even',

  'settle.heading': 'Settle up',
  'settle.summary': {
    one: '{count} payment settles everything.',
    other: '{count} payments settle everything.',
  },
  'settle.done': 'Everyone is settled up.',
  'settle.pays': '{from} pays {to} {amount}',
  'settle.note': 'Uses the fewest payments possible. Amounts are computed in whole cents.',

  'footer.storage': 'Your data stays in this browser.',
  'footer.source': 'Source code',
} satisfies Record<string, Message>;

export type MessageKey = keyof typeof en;
