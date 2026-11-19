import { useId, useState, type SubmitEvent } from 'react';
import type { Person, PersonId } from '../domain';
import { useI18n } from '../i18n/context';
import { cx } from './cx';
import { TrashIcon } from './Icons';
import ui from './ui.module.css';
import styles from './PeoplePanel.module.css';

interface PeoplePanelProps {
  people: Person[];
  isInvolved: (id: PersonId) => boolean;
  onAdd: (name: string) => void;
  onRemove: (id: PersonId) => void;
}

export function PeoplePanel({ people, isInvolved, onAdd, onRemove }: PeoplePanelProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const headingId = useId();
  const inputId = useId();
  const errorId = useId();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === '') {
      setError(t('people.error.empty'));
      return;
    }
    const taken = people.some(
      (person) => person.name.localeCompare(trimmed, undefined, { sensitivity: 'base' }) === 0,
    );
    if (taken) {
      setError(t('people.error.duplicate', { name: trimmed }));
      return;
    }
    onAdd(trimmed);
    setName('');
    setError(null);
  };

  const handleRemove = (person: Person) => {
    if (isInvolved(person.id)) {
      setError(t('people.error.inUse', { name: person.name }));
      return;
    }
    setError(null);
    onRemove(person.id);
  };

  return (
    <section className={ui.panel} aria-labelledby={headingId}>
      <div className={ui.panelHeader}>
        <h2 id={headingId} className={ui.heading}>
          {t('people.heading')}
        </h2>
        {people.length > 0 && (
          <span className={ui.meta}>{t('people.count', { count: people.length })}</span>
        )}
      </div>

      <div>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={ui.field}>
            <label className={ui.label} htmlFor={inputId}>
              {t('people.nameLabel')}
            </label>
            <input
              id={inputId}
              className={ui.input}
              value={name}
              placeholder={t('people.namePlaceholder')}
              autoComplete="off"
              maxLength={40}
              aria-invalid={error !== null && name.trim() === '' ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </div>
          <button type="submit" className={cx(ui.button, styles.submit)}>
            {t('people.add')}
          </button>
        </form>
        <p id={errorId} className={cx(ui.error, styles.error)} role="alert">
          {error}
        </p>
      </div>

      {people.length === 0 ? (
        <p className={ui.empty}>{t('people.empty')}</p>
      ) : (
        <ul className={ui.list}>
          {people.map((person) => (
            <li key={person.id} className={ui.listItem}>
              <span className={ui.avatar} aria-hidden="true">
                {person.name.slice(0, 1)}
              </span>
              <span className={ui.grow}>{person.name}</span>
              <button
                type="button"
                className={ui.iconButton}
                aria-label={t('people.remove', { name: person.name })}
                title={t('people.remove', { name: person.name })}
                onClick={() => {
                  handleRemove(person);
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
