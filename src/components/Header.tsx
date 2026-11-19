import { useId } from 'react';
import { useI18n } from '../i18n/context';
import { CURRENCIES, currencyName, isCurrency, type Currency } from '../i18n/format';
import { isLocale, LOCALE_NAMES, LOCALES } from '../i18n/locales';
import styles from './Header.module.css';
import ui from './ui.module.css';

interface HeaderProps {
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export function Header({ currency, onCurrencyChange }: HeaderProps) {
  const { t, locale, setLocale } = useI18n();
  const languageId = useId();
  const currencyId = useId();

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <h1 className={styles.title}>{t('app.title')}</h1>
        <p className={styles.tagline}>{t('app.tagline')}</p>
      </div>
      <div className={styles.settings} role="group" aria-label={t('settings.label')}>
        <div className={ui.field}>
          <label className={ui.label} htmlFor={languageId}>
            {t('settings.language')}
          </label>
          <select
            id={languageId}
            className={ui.select}
            value={locale}
            onChange={(event) => {
              if (isLocale(event.target.value)) setLocale(event.target.value);
            }}
          >
            {LOCALES.map((option) => (
              <option key={option} value={option} lang={option}>
                {LOCALE_NAMES[option]}
              </option>
            ))}
          </select>
        </div>
        <div className={ui.field}>
          <label className={ui.label} htmlFor={currencyId}>
            {t('settings.currency')}
          </label>
          <select
            id={currencyId}
            className={ui.select}
            value={currency}
            onChange={(event) => {
              if (isCurrency(event.target.value)) onCurrencyChange(event.target.value);
            }}
          >
            {CURRENCIES.map((option) => (
              <option key={option} value={option}>
                {option} · {currencyName(option, locale)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
