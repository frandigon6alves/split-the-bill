import { useMemo } from 'react';
import { BalancesPanel } from './components/BalancesPanel';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { Header } from './components/Header';
import { PeoplePanel } from './components/PeoplePanel';
import { SettlementPanel } from './components/SettlementPanel';
import ui from './components/ui.module.css';
import { computeBalances, settle } from './domain';
import { useI18n } from './i18n/context';
import { isInvolved } from './state/group';
import { createId } from './state/ids';
import { useGroup } from './state/useGroup';
import styles from './App.module.css';

export function App() {
  const { t, locale } = useI18n();
  const [group, dispatch] = useGroup(locale);
  const { people, expenses, currency } = group;

  const balances = useMemo(() => computeBalances(people, expenses), [people, expenses]);
  const transfers = useMemo(() => settle(balances), [balances]);

  const handleReset = () => {
    if (window.confirm(t('group.resetConfirm'))) dispatch({ type: 'reset' });
  };

  return (
    <div className={styles.shell}>
      <Header
        currency={currency}
        onCurrencyChange={(next) => {
          dispatch({ type: 'setCurrency', currency: next });
        }}
      />

      <main className={styles.main}>
        <div className={styles.column}>
          <PeoplePanel
            people={people}
            isInvolved={(id) => isInvolved(group, id)}
            onAdd={(name) => {
              dispatch({ type: 'addPerson', person: { id: createId(), name } });
            }}
            onRemove={(id) => {
              dispatch({ type: 'removePerson', id });
            }}
          />
          <ExpenseForm
            people={people}
            currency={currency}
            onAdd={(expense) => {
              dispatch({ type: 'addExpense', expense });
            }}
          />
        </div>
        <div className={styles.column}>
          <SettlementPanel people={people} transfers={transfers} currency={currency} />
          <BalancesPanel people={people} balances={balances} currency={currency} />
          <ExpenseList
            expenses={expenses}
            people={people}
            currency={currency}
            onRemove={(id) => {
              dispatch({ type: 'removeExpense', id });
            }}
          />
        </div>
      </main>

      <footer className={styles.footer}>
        <p>{t('footer.storage')}</p>
        <div className={styles.footerActions}>
          {(people.length > 0 || expenses.length > 0) && (
            <button type="button" className={ui.buttonSecondary} onClick={handleReset}>
              {t('group.reset')}
            </button>
          )}
          <a href="https://github.com/frandigon6alves/split-the-bill">{t('footer.source')}</a>
        </div>
      </footer>
    </div>
  );
}
