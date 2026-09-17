import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routes } from '../../../app/router';
import type { CartLine } from '../../cart/cartReducer';
import { CART_STORAGE_KEY } from '../../cart/cartStorage';
import { COMPLETED_ORDER_STORAGE_KEY } from '../orderStorage';

function seedCart(lines: readonly CartLine[] = [
  { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 2 },
  { productId: 'B0CH4R65PD', variantId: 'with-cable', quantity: 1 },
]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ lines }));
}

function renderRoute(path = '/checkout/payment') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(<RouterProvider router={router} />);
  return { router, ...view };
}

function fillCard(number: string) {
  fireEvent.change(screen.getByLabelText('Cardholder name'), { target: { value: 'Demo Shopper' } });
  fireEvent.change(screen.getByLabelText('Card number'), { target: { value: number } });
  fireEvent.change(screen.getByLabelText('Expiry'), { target: { value: '1299' } });
  fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } });
}

describe('PaymentPage', () => {
  it('connects the cart checkout button to the checkout route', async () => {
    const user = userEvent.setup();
    seedCart([{ productId: 'B0QW7A2N9K', variantId: 'black', quantity: 1 }]);
    renderRoute('/gp/cart/view.html');

    await user.click(screen.getByRole('link', { name: 'Proceed to checkout' }));

    expect(await screen.findByRole('heading', { name: 'Checkout' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Payment method' })).toBeInTheDocument();
  });

  it('handles an empty cart without exposing payment controls', () => {
    renderRoute();

    expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Place your order' })).not.toBeInTheDocument();
  });

  it('shows shared cart totals, savings, products, and quantities', () => {
    seedCart();
    renderRoute();
    const summary = screen.getByRole('complementary', { name: 'Order Summary' });

    expect(within(summary).getByText('$409.97')).toBeInTheDocument();
    expect(within(summary).getByText('−$107.00')).toBeInTheDocument();
    expect(within(summary).getByText('$302.97')).toBeInTheDocument();
    expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
    expect(screen.getByText('Quantity: 1')).toBeInTheDocument();
  });

  it('selects COA by default and completes an order while preventing duplicate submission', async () => {
    seedCart([{ productId: 'B0CH4R65PD', variantId: 'charger-only', quantity: 1 }]);
    renderRoute();

    expect(screen.getByRole('radio', { name: /Cash on Arrival/ })).toBeChecked();
    expect(screen.getByText(/No additional payment details/)).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Place your order' });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(screen.getByRole('button', { name: 'Processing order…' })).toBeDisabled();

    expect(await screen.findByRole('heading', { name: /demo order is confirmed/i }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('Cash on Arrival (COA)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cart, 0 items' })).toBeInTheDocument();
  });

  it('validates missing and malformed card fields inline', async () => {
    const user = userEvent.setup();
    seedCart();
    renderRoute();

    await user.click(screen.getByRole('radio', { name: /^Card/ }));
    await user.click(screen.getByRole('button', { name: 'Place your order' }));
    expect(screen.getByText('Enter the cardholder name.')).toBeInTheDocument();
    expect(screen.getByText('Enter a test card number.')).toBeInTheDocument();
    expect(screen.getByText('Enter an expiry date.')).toBeInTheDocument();
    expect(screen.getByText('Enter a CVV.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Cardholder name')).toHaveFocus());

    await user.type(screen.getByLabelText('Cardholder name'), 'Demo Shopper');
    await user.type(screen.getByLabelText('Card number'), '1234');
    await user.type(screen.getByLabelText('Expiry'), '1325');
    await user.type(screen.getByLabelText('CVV'), '12');
    await user.click(screen.getByRole('button', { name: 'Place your order' }));
    expect(screen.getByText('Enter a 16-digit card number.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid month.')).toBeInTheDocument();
    expect(screen.getByText('Enter a 3-digit CVV.')).toBeInTheDocument();
  });

  it('completes the successful test card, clears the cart, and stores no card data', async () => {
    const user = userEvent.setup();
    seedCart();
    const firstView = renderRoute();

    await user.click(screen.getByRole('radio', { name: /^Card/ }));
    fillCard('4242424242424242');
    await user.click(screen.getByRole('button', { name: 'Place your order' }));

    expect(await screen.findByRole('heading', { name: /demo order is confirmed/i }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('Demo card ending in 4242')).toBeInTheDocument();
    expect(screen.getByText('$302.97', { selector: 'dd' })).toBeInTheDocument();
    await waitFor(() => expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe('{"lines":[]}'));
    const storedOrder = window.sessionStorage.getItem(COMPLETED_ORDER_STORAGE_KEY) ?? '';
    expect(storedOrder).not.toContain('4242424242424242');
    expect(storedOrder).not.toContain('Demo Shopper');
    expect(storedOrder).not.toContain('123');

    firstView.unmount();
    renderRoute('/order/success');
    expect(screen.getByRole('heading', { name: /demo order is confirmed/i })).toBeInTheDocument();
    expect(screen.getByText(/ORDER-[A-Z0-9]{8}/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue Shopping' })).toHaveAttribute('href', '/s');
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/');
  });

  it('declines the declined test card inline and preserves the cart', async () => {
    const user = userEvent.setup();
    seedCart([{ productId: 'B0QW7A2N9K', variantId: 'black', quantity: 1 }]);
    renderRoute();

    await user.click(screen.getByRole('radio', { name: /^Card/ }));
    fillCard('4000000000000002');
    await user.click(screen.getByRole('button', { name: 'Place your order' }));

    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('Payment was declined');
    expect(screen.getByRole('button', { name: 'Place your order' })).toBeEnabled();
    expect(screen.getByRole('link', { name: 'Cart, 1 item' })).toBeInTheDocument();
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toContain('B0QW7A2N9K');
    expect(window.sessionStorage.getItem(COMPLETED_ORDER_STORAGE_KEY)).toBeNull();
  });
});
