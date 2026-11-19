import { useId } from 'react';
import type { Person, Transfer } from '../domain';
import { useI18n } from '../i18n/context';
import { formatMoney, type Currency } from '../i18n/format';
import { ArrowIcon } from './Icons';
import styles from './SettlementPanel.module.css';
import ui from './ui.module.css';

interface SettlementPanelProps {
  people: Person[];
  transfers: Transfer[];
  currency: Currency;
}

export function SettlementPanel({ people, transfers, currency }: SettlementPanelProps) {
  const { t, locale } = useI18n();
  const headingId = useId();
  const nameOf = (id: string) => people.find((person) => person.id === id)?.name ?? '?';

  return (
    <section className={ui.panel} aria-labelledby={headingId}>
      <h2 id={headingId} className={ui.heading}>
        {t('settle.heading')}
      </h2>
      {/* Announced politely whenever the result changes. */}
      <div aria-live="polite" className={styles.results}>
        {transfers.length === 0 ? (
          <p className={styles.done}>{t('settle.done')}</p>
        ) : (
          <>
            <p className={styles.summary}>{t('settle.summary', { count: transfers.length })}</p>
            <ol className={styles.list}>
              {transfers.map((transfer) => {
                const from = nameOf(transfer.from);
                const to = nameOf(transfer.to);
                const amount = formatMoney(transfer.amountCents, currency, locale);
                return (
                  <li key={`${transfer.from}-${transfer.to}`} className={styles.item}>
                    <span className="visually-hidden">
                      {t('settle.pays', { from, to, amount })}
                    </span>
                    <span className={styles.visual} aria-hidden="true">
                      <span className={styles.person}>{from}</span>
                      <ArrowIcon />
                      <span className={styles.person}>{to}</span>
                      <span className={styles.amount}>{amount}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
      <p className={ui.meta}>{t('settle.note')}</p>
    </section>
  );
}
