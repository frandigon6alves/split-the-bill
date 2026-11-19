import { useId } from 'react';
import { sharesOf, totalSpent, type Expense, type Person } from '../domain';
import { useI18n } from '../i18n/context';
import { formatMoney, type Currency } from '../i18n/format';
import { TrashIcon } from './Icons';
import styles from './ExpenseList.module.css';
import ui from './ui.module.css';

interface ExpenseListProps {
  expenses: Expense[];
  people: Person[];
  currency: Currency;
  onRemove: (id: string) => void;
}

export function ExpenseList({ expenses, people, currency, onRemove }: ExpenseListProps) {
  const { t, locale } = useI18n();
  const headingId = useId();
  const money = (cents: number) => formatMoney(cents, currency, locale);
  const nameOf = (id: string) => people.find((person) => person.id === id)?.name ?? '?';

  return (
    <section className={ui.panel} aria-labelledby={headingId}>
      <div className={ui.panelHeader}>
        <h2 id={headingId} className={ui.heading}>
          {t('expenses.heading')}
        </h2>
        {expenses.length > 0 && (
          <span className={ui.meta}>
            {t('expenses.count', { count: expenses.length })} ·{' '}
            {t('expenses.total', { amount: money(totalSpent(expenses)) })}
          </span>
        )}
      </div>

      {expenses.length === 0 ? (
        <p className={ui.empty}>{t('expenses.empty')}</p>
      ) : (
        <ul className={ui.list}>
          {[...expenses].reverse().map((expense) => (
            <li key={expense.id} className={ui.listItem}>
              <div className={ui.grow}>
                <p className={styles.title}>{expense.description}</p>
                <p className={ui.meta}>
                  {t('expenses.paidBy', {
                    name: nameOf(expense.paidBy),
                    amount: money(expense.amountCents),
                  })}{' '}
                  · {t('expenses.sharedBy', { count: sharesOf(expense).size })}
                </p>
              </div>
              <span className={ui.amount}>{money(expense.amountCents)}</span>
              <button
                type="button"
                className={ui.iconButton}
                aria-label={t('expenses.remove', { description: expense.description })}
                title={t('expenses.remove', { description: expense.description })}
                onClick={() => {
                  onRemove(expense.id);
                }}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
