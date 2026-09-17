import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CartProvider } from '../../../features/cart/CartContext';
import { DesktopHeader } from './DesktopHeader';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderHeader(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CartProvider>
        <DesktopHeader />
        <LocationProbe />
      </CartProvider>
    </MemoryRouter>,
  );
}

describe('DesktopHeader', () => {
  it('renders the Amazon desktop navigation landmarks', () => {
    renderHeader();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary departments' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Amazon Clone home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cart, 0 items' })).toBeInTheDocument();
    expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
  });

  it('submits a search using Amazon-style query parameters', async () => {
    const user = userEvent.setup();
    renderHeader();

    const searchInput = screen.getByRole('searchbox', { name: 'Search Amazon' });
    await user.type(searchInput, 'wireless headphones');
    await user.click(screen.getByRole('button', { name: /^Search$/ }));

    expect(screen.getByTestId('location')).toHaveTextContent('/s?k=wireless+headphones');
    expect(searchInput).toHaveValue('wireless headphones');
  });

  it('hydrates its query and department from the current URL', () => {
    renderHeader('/s?k=desk+lamp&category=office');

    expect(screen.getByRole('searchbox', { name: 'Search Amazon' })).toHaveValue('desk lamp');
    expect(screen.getByRole('combobox', { name: 'Search department' })).toHaveValue('office');
    expect(screen.getByText('Office', { selector: '[data-department-label]' })).toBeVisible();
  });

  it('opens the navigation drawer and routes from a department link', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'All' }));

    expect(screen.getByRole('dialog', { name: 'Hello, sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.click(screen.getByRole('link', { name: 'Electronics' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/s?category=electronics&k=Electronics');
    expect(screen.queryByRole('dialog', { name: 'Hello, sign in' })).not.toBeInTheDocument();
  });

  it('moves focus into the drawer and restores it after Escape', async () => {
    const user = userEvent.setup();
    renderHeader();
    const trigger = screen.getByRole('button', { name: 'All' });

    await user.click(trigger);
    const drawer = screen.getByRole('dialog', { name: 'Hello, sign in' });
    expect(within(drawer).getByRole('button', { name: 'Close navigation menu' })).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
