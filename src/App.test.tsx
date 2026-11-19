import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { I18nProvider } from './i18n/I18nProvider';
import type { Locale } from './i18n/locales';
import { GROUP_STORAGE_KEY } from './state/group';

function renderApp(locale: Locale = 'en') {
  const user = userEvent.setup();
  const view = render(
    <I18nProvider initialLocale={locale}>
      <App />
    </I18nProvider>,
  );
  return { user, ...view };
}

type User = ReturnType<typeof userEvent.setup>;

async function addPeople(user: User, ...names: string[]) {
  for (const name of names) {
    await user.type(screen.getByLabelText('Name'), `${name}{Enter}`);
  }
}

async function addExpense(user: User, description: string, amount: string, paidBy: string) {
  await user.type(screen.getByLabelText('Description'), description);
  await user.type(screen.getByLabelText('Amount (USD)'), amount);
  await user.selectOptions(screen.getByLabelText('Paid by'), paidBy);
  await user.click(screen.getByRole('button', { name: 'Add expense' }));
}

const expensePanel = () => screen.getByRole('region', { name: 'Add an expense' });
const settlePanel = () => screen.getByRole('region', { name: 'Settle up' });

describe('App', () => {
  it('starts empty and asks for people first', () => {
    renderApp();
    expect(screen.getByRole('heading', { level: 1, name: 'Split the bill' })).toBeInTheDocument();
    expect(screen.getByText('Add the people sharing costs to get started.')).toBeInTheDocument();
    expect(screen.getByText('Add at least one person before adding expenses.')).toBeInTheDocument();
    expect(within(settlePanel()).getByText('Everyone is settled up.')).toBeInTheDocument();
  });

  it('adds people and rejects empty or duplicate names', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Add person' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a name.');

    await addPeople(user, 'Ana', 'Bruno', 'ana');
    expect(screen.getByRole('alert')).toHaveTextContent('ana is already in the group.');
    expect(screen.getByText('2 people')).toBeInTheDocument();
  });

  it('splits an expense equally and shows who pays whom', async () => {
    const { user } = renderApp();
    await addPeople(user, 'Ana', 'Bruno', 'Carla');
    await addExpense(user, 'Dinner', '90', 'Ana');

    expect(screen.getByRole('status')).toHaveTextContent('Added “Dinner”.');
    const balances = screen.getByRole('region', { name: 'Balances' });
    expect(within(balances).getByText('gets back $60.00')).toBeInTheDocument();
    expect(within(balances).getAllByText('owes $30.00')).toHaveLength(2);

    expect(within(settlePanel()).getByText('2 payments settle everything.')).toBeInTheDocument();
    expect(within(settlePanel()).getByText('Bruno pays Ana $30.00')).toBeInTheDocument();
    expect(within(settlePanel()).getByText('Carla pays Ana $30.00')).toBeInTheDocument();
  });

  it('lets people opt out of an equal split', async () => {
    const { user } = renderApp();
    await addPeople(user, 'Ana', 'Bruno', 'Carla');
    await user.click(screen.getByRole('checkbox', { name: 'Carla' }));
    await addExpense(user, 'Taxi', '10.01', 'Ana');

    expect(screen.getByText(/split between 2 people/)).toBeInTheDocument();
    expect(within(settlePanel()).getByText('Bruno pays Ana $5.00')).toBeInTheDocument();
    expect(within(settlePanel()).getByText('1 payment settles everything.')).toBeInTheDocument();
  });

  it('validates the expense form', async () => {
    const { user } = renderApp();
    await addPeople(user, 'Ana');
    await user.click(screen.getByRole('button', { name: 'Add expense' }));

    const errors = within(expensePanel()).getByRole('alert');
    expect(errors).toHaveTextContent('Enter a description.');
    expect(errors).toHaveTextContent('Enter an amount greater than zero');
    expect(screen.getByLabelText('Description')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('region', { name: 'Expenses' })).toHaveTextContent('No expenses yet.');
  });

  it('supports custom shares that must add up to the total', async () => {
    const { user } = renderApp();
    await addPeople(user, 'Ana', 'Bruno');
    await user.type(screen.getByLabelText('Description'), 'Groceries');
    await user.type(screen.getByLabelText('Amount (USD)'), '50');
    await user.click(screen.getByRole('radio', { name: 'Custom amounts' }));

    await user.type(screen.getByLabelText('Share for Ana'), '10');
    expect(screen.getByText('$40.00 left to assign')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Share for Bruno'), '45');
    expect(screen.getByText('$5.00 more than the total')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add expense' }));
    expect(within(expensePanel()).getByRole('alert')).toHaveTextContent(
      'Custom shares must add up to the total.',
    );

    await user.clear(screen.getByLabelText('Share for Bruno'));
    await user.type(screen.getByLabelText('Share for Bruno'), '40');
    expect(screen.getByText('Shares add up to the total')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add expense' }));

    expect(within(settlePanel()).getByText('Bruno pays Ana $40.00')).toBeInTheDocument();
  });

  it('deletes expenses and protects people who are part of one', async () => {
    const { user } = renderApp();
    await addPeople(user, 'Ana', 'Bruno');
    await addExpense(user, 'Coffee', '4', 'Ana');

    await user.click(screen.getByRole('button', { name: 'Remove Bruno' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Bruno is part of an expense.');
    expect(screen.getByText('2 people')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete “Coffee”' }));
    expect(screen.getByText('No expenses yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Bruno' }));
    expect(screen.getByText('1 person')).toBeInTheDocument();
  });

  it('switches language, updates the lang attribute and remembers the choice', async () => {
    const { user, unmount } = renderApp();
    await user.selectOptions(screen.getByLabelText('Language'), 'pt-BR');

    expect(document.documentElement.lang).toBe('pt-BR');
    expect(screen.getByRole('heading', { level: 1, name: 'Dividir a conta' })).toBeInTheDocument();
    expect(screen.getByLabelText('Moeda')).toBeInTheDocument();

    unmount();
    render(
      <I18nProvider>
        <App />
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Dividir a conta' })).toBeInTheDocument();
  });

  it('detects the language from the browser', () => {
    const languages = vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-AR', 'en']);
    render(
      <I18nProvider>
        <App />
      </I18nProvider>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Dividir la cuenta' }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');
    languages.mockRestore();
  });

  it('formats amounts in the chosen currency and locale', async () => {
    const { user } = renderApp('pt-BR');
    expect(screen.getByLabelText('Moeda')).toHaveValue('BRL');
    await addPeopleIn(user, 'Nome', 'Ana', 'Bruno');
    await user.type(screen.getByLabelText('Descrição'), 'Pizza');
    const form = screen.getByRole('region', { name: 'Adicionar despesa' });
    await user.type(within(form).getByLabelText('Valor (BRL)'), '25,50');
    await user.click(screen.getByRole('button', { name: 'Adicionar despesa' }));

    const panel = screen.getByRole('region', { name: 'Acertar as contas' });
    expect(within(panel).getByText('1 pagamento resolve tudo.')).toBeInTheDocument();
    expect(within(panel).getByText(/^Bruno paga R\$\s12,75 para Ana$/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Moeda'), 'EUR');
    expect(within(panel).getByText(/^Bruno paga €\s12,75 para Ana$/)).toBeInTheDocument();
  });

  it('persists the group across reloads', async () => {
    const { user, unmount } = renderApp();
    await addPeople(user, 'Ana', 'Bruno');
    await addExpense(user, 'Tickets', '20', 'Bruno');
    expect(window.localStorage.getItem(GROUP_STORAGE_KEY)).toContain('Tickets');

    unmount();
    renderApp();
    expect(screen.getByText('Tickets')).toBeInTheDocument();
    expect(within(settlePanel()).getByText('Ana pays Bruno $10.00')).toBeInTheDocument();
  });

  it('starts over after confirmation', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { user } = renderApp();
    await addPeople(user, 'Ana');
    await user.click(screen.getByRole('button', { name: 'Start over' }));
    expect(confirm).toHaveBeenCalled();
    expect(screen.getByText('Add the people sharing costs to get started.')).toBeInTheDocument();
    confirm.mockRestore();
  });
});

async function addPeopleIn(user: User, label: string, ...names: string[]) {
  for (const name of names) {
    await user.type(screen.getByLabelText(label), `${name}{Enter}`);
  }
}
