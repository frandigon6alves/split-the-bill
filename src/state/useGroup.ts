import { useEffect, useReducer } from 'react';
import { DEFAULT_CURRENCY } from '../i18n/format';
import type { Locale } from '../i18n/locales';
import { emptyGroup, groupReducer, loadGroup, saveGroup } from './group';

/** Group state backed by localStorage. The first visit picks a currency based on the locale. */
export function useGroup(locale: Locale) {
  const [state, dispatch] = useReducer(
    groupReducer,
    locale,
    (initialLocale) => loadGroup() ?? emptyGroup(DEFAULT_CURRENCY[initialLocale]),
  );

  useEffect(() => {
    saveGroup(state);
  }, [state]);

  return [state, dispatch] as const;
}
