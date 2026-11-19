import { useId } from 'react';
import type { Balances, Person } from '../domain';
import { useI18n } from '../i18n/context';
import { formatMoney, type Currency } from '../i18n/format';
import { cx } from './cx';
import styles from './BalancesPanel.module.css';
import ui from './ui.module.css';

interface BalancesPanelProps {
  people: Person[];
  balances: Balances;
  currency: Currency;
}

export function BalancesPanel({ people, balances, currency }: BalancesPanelProps) {
  const { t, locale } = useI18n();
  const headingId = useId();
  const largest = Math.max(1, ...[...balances.values()].map((cents) => Math.abs(cents)));

  return (
    <section className={ui.panel} aria-labelledby={headingId}>
      <h2 id={headingId} className={ui.heading}>
        {t('balances.heading')}
      </h2>
      {people.length === 0 ? (
        <p className={ui.empty}>{t('balances.empty')}</p>
      ) : (
        <ul className={ui.list}>
          {people.map((person) => {
            const cents = balances.get(person.id) ?? 0;
            const amount = formatMoney(Math.abs(cents), currency, locale);
            const label =
              cents > 0
                ? t('balances.getsBack', { amount })
                : cents < 0
                  ? t('balances.owes', { amount })
                  : t('balances.even');
            return (
              <li key={person.id} className={cx(ui.listItem, styles.row)}>
                <span className={styles.name}>{person.name}</span>
                <span
                  className={cx(
                    styles.status,
                    cents > 0 && styles.positive,
                    cents < 0 && styles.negative,
                  )}
                >
                  {label}
                </span>
                <span className={styles.track} aria-hidden="true">
                  <span
                    className={cx(styles.bar, cents >= 0 ? styles.barPositive : styles.barNegative)}
                    style={{ width: `${(Math.abs(cents) / largest) * 50}%` }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
