import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routes } from '../../../app/router';
import type { CartLine } from '../cartReducer';
import { CART_STORAGE_KEY } from '../cartStorage';

function seedCart(lines: readonly CartLine[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ lines }));
}

function renderRoute(path = '/gp/cart/view.html') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(<RouterProvider router={router} />);
  return { router, ...view };
}

describe('CartPage', () => {
  it('renders an empty cart through the /cart alias', async () => {
    renderRoute('/cart');

    expect(await screen.findByRole('heading', { name: 'Shopping Cart' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your Amazon Cart is empty' })).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Cart subtotal' })).not.toBeInTheDocument();
  });

  it('renders one product with its variant, quantity, price, and subtotal', () => {
    seedCart([{ productId: 'B0QW7A2N9K', variantId: 'black', quantity: 1 }]);
    const { container } = renderRoute();

    expect(container.querySelectorAll('[data-cart-row]')).toHaveLength(1);
    expect(screen.getByText('Midnight Black')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Quantity for AeroSound/i })).toHaveValue('1');
    expect(screen.getByRole('link', { name: 'Cart, 1 item' })).toBeInTheDocument();
    expect(within(screen.getByRole('complementary', { name: 'Cart subtotal' })).getByText('$129.99'))
      .toBeInTheDocument();
  });

  it('renders several products and calculates subtotal and savings', () => {
    seedCart([
      { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 2 },
      { productId: 'B0CH4R65PD', variantId: 'with-cable', quantity: 1 },
    ]);
    const { container } = renderRoute();
    const subtotal = screen.getByRole('complementary', { name: 'Cart subtotal' });

    expect(container.querySelectorAll('[data-cart-row]')).toHaveLength(2);
    expect(within(subtotal).getByText('$302.97')).toBeInTheDocument();
    expect(within(subtotal).getByText('Your savings: $107.00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cart, 3 items' })).toBeInTheDocument();
  });

  it('merges repeated additions of the same product and variant into one row', async () => {
    const user = userEvent.setup();
    const { container } = renderRoute('/dp/B0QW7A2N9K');
    const buyBox = screen.getByRole('complementary', { name: 'Purchase options' });

    await user.selectOptions(within(buyBox).getByRole('combobox', { name: 'Quantity:' }), '2');
    await user.click(within(buyBox).getByRole('button', { name: 'Add to Cart' }));
    await user.click(within(buyBox).getByRole('button', { name: 'Add to Cart' }));
    await user.click(screen.getByRole('link', { name: 'Cart, 4 items' }));

    expect(await screen.findByRole('heading', { name: 'Shopping Cart' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-cart-row]')).toHaveLength(1);
    expect(screen.getByRole('combobox', { name: /Quantity for AeroSound/i })).toHaveValue('4');
  });

  it('keeps variants of the same product as separate cart rows', () => {
    seedCart([
      { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 1 },
      { productId: 'B0QW7A2N9K', variantId: 'sand', quantity: 2 },
    ]);
    const { container } = renderRoute();

    expect(container.querySelectorAll('[data-cart-row]')).toHaveLength(2);
    expect(screen.getByText('Midnight Black')).toBeInTheDocument();
    expect(screen.getByText('Soft Sand')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cart, 3 items' })).toBeInTheDocument();
  });

  it('updates quantities, subtotal, item count, and supports deletion', async () => {
    const user = userEvent.setup();
    seedCart([
      { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 1 },
      { productId: 'B0CH4R65PD', variantId: 'charger-only', quantity: 1 },
    ]);
    const { container } = renderRoute();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Quantity for AeroSound/i }),
      '3',
    );
    expect(screen.getByRole('link', { name: 'Cart, 4 items' })).toBeInTheDocument();
    expect(within(screen.getByRole('complementary', { name: 'Cart subtotal' })).getByText('$424.96'))
      .toBeInTheDocument();

    const rows = container.querySelectorAll<HTMLElement>('[data-cart-row]');
    await user.click(within(rows[1]).getByRole('button', { name: 'Delete' }));

    expect(container.querySelectorAll('[data-cart-row]')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Cart, 3 items' })).toBeInTheDocument();
    expect(within(screen.getByRole('complementary', { name: 'Cart subtotal' })).getByText('$389.97'))
      .toBeInTheDocument();
  });

  it('restores cart contents from localStorage after the app remounts', async () => {
    const user = userEvent.setup();
    const firstView = renderRoute('/dp/B0CH4R65PD');
    const buyBox = screen.getByRole('complementary', { name: 'Purchase options' });
    await user.click(screen.getByRole('radio', { name: /With 6 ft USB-C cable/i }));
    await user.click(within(buyBox).getByRole('button', { name: 'Add to Cart' }));

    await waitFor(() => expect(window.localStorage.getItem(CART_STORAGE_KEY)).toContain('with-cable'));
    firstView.unmount();
    const refreshedView = renderRoute();

    expect(refreshedView.container.querySelectorAll('[data-cart-row]')).toHaveLength(1);
    expect(screen.getByText('With 6 ft USB-C cable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cart, 1 item' })).toBeInTheDocument();
    expect(within(screen.getByRole('complementary', { name: 'Cart subtotal' })).getByText('$42.99'))
      .toBeInTheDocument();
  });
});
