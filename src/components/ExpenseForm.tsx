import { useId, useState, type SubmitEvent } from 'react';
import {
  parseAmountToCents,
  validateExpense,
  type Expense,
  type ExpenseError,
  type Person,
  type PersonId,
  type Split,
} from '../domain';
import { useI18n } from '../i18n/context';
import { formatMoney, type Currency } from '../i18n/format';
import type { MessageKey } from '../i18n/locales';
import { createId } from '../state/ids';
import { cx } from './cx';
import styles from './ExpenseForm.module.css';
import ui from './ui.module.css';

interface ExpenseFormProps {
  people: Person[];
  currency: Currency;
  onAdd: (expense: Expense) => void;
}

type SplitMode = Split['kind'];

const ERROR_MESSAGES: Record<ExpenseError, MessageKey> = {
  'description-empty': 'expense.error.description',
  'amount-invalid': 'expense.error.amount',
  'payer-unknown': 'expense.error.participants',
  'participants-empty': 'expense.error.participants',
  'participant-unknown': 'expense.error.participants',
  'share-invalid': 'expense.error.share',
  'shares-mismatch': 'expense.error.shares',
};

export function ExpenseForm({ people, currency, onAdd }: ExpenseFormProps) {
  const { t, locale } = useI18n();
  const ids = {
    heading: useId(),
    description: useId(),
    amount: useId(),
    paidBy: useId(),
    errors: useId(),
    status: useId(),
  };

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<PersonId>('');
  const [mode, setMode] = useState<SplitMode>('equal');
  // Track who is left out rather than who is in, so people added later are included by default.
  const [excluded, setExcluded] = useState<ReadonlySet<PersonId>>(new Set());
  const [customShares, setCustomShares] = useState<Record<PersonId, string>>({});
  const [errors, setErrors] = useState<ExpenseError[]>([]);
  const [status, setStatus] = useState('');

  const payer = people.some((person) => person.id === paidBy) ? paidBy : (people[0]?.id ?? '');
  const amountCents = parseAmountToCents(amount);

  const parsedShares = people.map((person) => {
    const raw = customShares[person.id]?.trim() ?? '';
    return { id: person.id, cents: raw === '' ? 0 : parseAmountToCents(raw) };
  });
  const assignedCents = parsedShares.reduce((sum, share) => sum + (share.cents ?? 0), 0);
  const remainingCents = (amountCents ?? 0) - assignedCents;

  if (people.length === 0) {
    return (
      <section className={ui.panel} aria-labelledby={ids.heading}>
        <h2 id={ids.heading} className={ui.heading}>
          {t('expense.heading')}
        </h2>
        <p className={ui.empty}>{t('expense.needPeople')}</p>
      </section>
    );
  }

  const buildSplit = (): Split => {
    if (mode === 'equal') {
      return {
        kind: 'equal',
        participants: people.map((person) => person.id).filter((id) => !excluded.has(id)),
      };
    }
    const shares: Record<PersonId, number> = {};
    for (const share of parsedShares) shares[share.id] = share.cents ?? -1;
    return { kind: 'custom', shares };
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const expense: Expense = {
      id: createId(),
      description: description.trim(),
      amountCents: amountCents ?? -1,
      paidBy: payer,
      split: buildSplit(),
    };
    const problems = validateExpense(expense, new Set(people.map((person) => person.id)));
    setErrors(problems);
    if (problems.length > 0) {
      setStatus('');
      return;
    }
    onAdd(expense);
    setStatus(t('expense.added', { description: expense.description }));
    setDescription('');
    setAmount('');
    setCustomShares({});
  };

  const errorMessages = [...new Set(errors.map((error) => t(ERROR_MESSAGES[error])))];
  const describedBy = errors.length > 0 ? ids.errors : undefined;
  const has = (...codes: ExpenseError[]) => codes.some((code) => errors.includes(code));

  return (
    <section className={ui.panel} aria-labelledby={ids.heading}>
      <h2 id={ids.heading} className={ui.heading}>
        {t('expense.heading')}
      </h2>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={cx(ui.field, styles.description)}>
          <label className={ui.label} htmlFor={ids.description}>
            {t('expense.description')}
          </label>
          <input
            id={ids.description}
            className={ui.input}
            value={description}
            placeholder={t('expense.descriptionPlaceholder')}
            autoComplete="off"
            maxLength={80}
            aria-invalid={has('description-empty') || undefined}
            aria-describedby={has('description-empty') ? describedBy : undefined}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
          />
        </div>

        <div className={ui.field}>
          <label className={ui.label} htmlFor={ids.amount}>
            {t('expense.amount')} <span className={ui.muted}>({currency})</span>
          </label>
          <input
            id={ids.amount}
            className={cx(ui.input, ui.amountInput)}
            value={amount}
            inputMode="decimal"
            placeholder="0.00"
            autoComplete="off"
            aria-invalid={has('amount-invalid') || undefined}
            aria-describedby={has('amount-invalid') ? describedBy : undefined}
            onChange={(event) => {
              setAmount(event.target.value);
            }}
          />
        </div>

        <div className={ui.field}>
          <label className={ui.label} htmlFor={ids.paidBy}>
            {t('expense.paidBy')}
          </label>
          <select
            id={ids.paidBy}
            className={ui.select}
            value={payer}
            onChange={(event) => {
              setPaidBy(event.target.value);
            }}
          >
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>

        <fieldset className={cx(styles.fieldset, styles.full)}>
          <legend className={ui.label}>{t('expense.splitMode')}</legend>
          <div className={styles.segmented}>
            {(['equal', 'custom'] as const).map((option) => (
              <label key={option} className={styles.segment}>
                <input
                  type="radio"
                  name="split-mode"
                  value={option}
                  checked={mode === option}
                  onChange={() => {
                    setMode(option);
                    setErrors([]);
                  }}
                />
                <span>{t(option === 'equal' ? 'expense.splitEqual' : 'expense.splitCustom')}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {mode === 'equal' ? (
          <fieldset
            className={cx(styles.fieldset, styles.full)}
            aria-invalid={has('participants-empty') || undefined}
            aria-describedby={has('participants-empty') ? describedBy : undefined}
          >
            <legend className={ui.label}>{t('expense.participants')}</legend>
            <div className={styles.chips}>
              {people.map((person) => (
                <label key={person.id} className={styles.chip}>
                  <input
                    type="checkbox"
                    checked={!excluded.has(person.id)}
                    onChange={(event) => {
                      const next = new Set(excluded);
                      if (event.target.checked) next.delete(person.id);
                      else next.add(person.id);
                      setExcluded(next);
                    }}
                  />
                  <span>{person.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <fieldset className={cx(styles.fieldset, styles.full)}>
            <legend className={ui.label}>{t('expense.participants')}</legend>
            <div className={styles.shares}>
              {people.map((person) => {
                const share = parsedShares.find((entry) => entry.id === person.id);
                const invalid = share?.cents === null;
                return (
                  <label key={person.id} className={styles.shareRow}>
                    <span className={ui.grow}>{person.name}</span>
                    <input
                      className={cx(ui.input, ui.amountInput, styles.shareInput)}
                      inputMode="decimal"
                      placeholder="0.00"
                      autoComplete="off"
                      aria-label={t('expense.shareFor', { name: person.name })}
                      aria-invalid={invalid || undefined}
                      value={customShares[person.id] ?? ''}
                      onChange={(event) => {
                        setCustomShares({ ...customShares, [person.id]: event.target.value });
                      }}
                    />
                  </label>
                );
              })}
            </div>
            <p
              className={cx(
                styles.remaining,
                remainingCents === 0 ? styles.balanced : styles.unbalanced,
              )}
              aria-live="polite"
            >
              {remainingCents === 0
                ? t('expense.balanced')
                : t(remainingCents > 0 ? 'expense.remaining' : 'expense.over', {
                    amount: formatMoney(Math.abs(remainingCents), currency, locale),
                  })}
            </p>
          </fieldset>
        )}

        {errorMessages.length > 0 && (
          <ul id={ids.errors} className={cx(ui.errorList, styles.full)} role="alert">
            {errorMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}

        <div className={cx(styles.actions, styles.full)}>
          <button type="submit" className={ui.button}>
            {t('expense.add')}
          </button>
          <p id={ids.status} className={ui.meta} role="status">
            {status}
          </p>
        </div>
      </form>
    </section>
  );
}
