# split-the-bill

Split shared expenses in a group and settle up with the fewest possible payments.

**Live demo:** https://frandigon6alves.github.io/split-the-bill/

A small, dependency-light React app for trips, flats and dinners: add the people, log who paid
for what, and get a short list of "X pays Y" transfers that clears every debt. Everything runs in
the browser; there is no backend and no account.

## Features

- Add people and expenses: who paid, how much, and who shares it.
- Split **equally** (with people opting out) or with **custom amounts** that must add up to the
  total, with a live "left to assign" hint.
- Per-person balances and a minimal list of settlements.
- All money is handled in **integer cents**, so totals never drift. Odd cents from uneven
  splits are assigned deterministically.
- **Three languages**: English, Spanish and Brazilian Portuguese, picked from the browser
  language and switchable at any time. Currency (EUR, USD, BRL) is formatted with
  `Intl.NumberFormat` for the active locale.
- State is saved to `localStorage`; storage errors (private mode, quota) are handled gracefully
  and corrupted data is discarded instead of crashing the app.
- Mobile-first layout, light and dark themes via `prefers-color-scheme`.
- Accessibility: labelled controls, visible focus, full keyboard support, `aria-live` regions
  for results and form feedback, and status that is never conveyed by colour alone.

## Tech stack

- React 19, TypeScript (strict), Vite
- Plain CSS with design tokens and CSS Modules
- Vitest and React Testing Library
- ESLint (typescript-eslint, strict type-checked) and Prettier
- pnpm, GitHub Actions (CI and GitHub Pages)

## How the settlement algorithm works

The domain logic lives in [`src/domain/`](src/domain) and has no React or browser dependencies.

1. **Shares.** Each expense is turned into per-person shares in cents. An equal split divides the
   total with integer division and hands the remainder out one cent at a time, so shares always
   add up to the total and differ by at most one cent.
2. **Balances.** Each person's balance is what they paid minus what they owe. Balances in a
   group always sum to zero.
3. **Settlements.** Any set of payments splits the group into clusters whose balances sum to
   zero, and a cluster of _k_ people needs at least _k − 1_ payments. So the minimum number of
   payments is _n − g_, where _g_ is the largest number of disjoint zero-sum groups. The app
   finds that partition with a dynamic programme over subsets (O(2ⁿ·n)), then settles each group
   greedily, with the largest debtor paying the largest creditor.

   Finding the true minimum is NP-hard, so the exact search is only used when up to 16 people
   have a non-zero balance. Larger groups fall back to the greedy strategy, which still
   guarantees at most _n − 1_ payments.

The tests in `src/domain/*.test.ts` cover rounding remainders, custom shares, zero balances,
cases where plain greedy needs an extra payment, and randomised groups.

## Internationalisation

Translations are a small typed message catalogue in [`src/i18n/`](src/i18n), with no i18n
library:

- `locales/en.ts` is the source of truth; its keys define the `MessageKey` type, so `t()` only
  accepts keys that exist.
- Other locales are typed as `Record<MessageKey, Message>`, so a missing or extra key is a
  compile error. `catalogue.test.ts` also checks at runtime that every locale has the same keys
  and the same `{placeholders}` as English, and only uses plural categories that exist in that
  language.
- Plurals are objects keyed by CLDR category (`one`, `other`, ...) and are selected with
  `Intl.PluralRules`; missing categories fall back to `other`.
- The active locale is saved, set on `<html lang>`, and used for all number and currency
  formatting.

### Adding a language

1. Copy `src/i18n/locales/es.ts` to a new file, e.g. `fr.ts`, and translate every message. Add
   plural forms for any extra categories the language uses (check
   `new Intl.PluralRules('fr').resolvedOptions().pluralCategories`).
2. In `src/i18n/locales.ts`, add the locale code to `LOCALES`, its catalogue to `catalogues`,
   and its name (written in that language) to `LOCALE_NAMES`.
3. Add a default currency for it in `DEFAULT_CURRENCY` in `src/i18n/format.ts`.
4. Run `pnpm typecheck && pnpm test`. The catalogue tests pick up the new locale automatically.

## Getting started

Requires Node 24 and pnpm.

```sh
pnpm install
pnpm dev
```

## Scripts

| Script           | What it does                                  |
| ---------------- | --------------------------------------------- |
| `pnpm dev`       | Start the Vite dev server                     |
| `pnpm build`     | Build for production into `dist/`             |
| `pnpm preview`   | Serve the production build locally            |
| `pnpm test`      | Run the unit and component tests once         |
| `pnpm lint`      | Run ESLint and check formatting with Prettier |
| `pnpm format`    | Format the code with Prettier                 |
| `pnpm typecheck` | Type-check the project with `tsc`             |

## License

[MIT](LICENSE)
