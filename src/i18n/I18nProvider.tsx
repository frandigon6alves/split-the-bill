import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, type I18nContextValue } from './context';
import { detectLocale, saveLocale } from './detect';
import type { Locale } from './locales';
import { createTranslator } from './translate';

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(() => initialLocale ?? detectLocale());
  const t = useMemo(() => createTranslator(locale), [locale]);

  // Keep the document in sync so screen readers, spell-checkers and the tab title follow along.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t('app.title');
  }, [locale, t]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t,
      setLocale: (next) => {
        setLocale(next);
        saveLocale(next);
      },
    }),
    [locale, t],
  );

  return <I18nContext value={value}>{children}</I18nContext>;
}
