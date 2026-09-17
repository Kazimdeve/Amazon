import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routes } from './router';

function renderRoute(initialEntry: string) {
  const testRouter = createMemoryRouter(routes, {
    initialEntries: [initialEntry],
  });

  return render(<RouterProvider router={testRouter} />);
}

describe('application routes', () => {
  it.each([
    ['/', 'Home'],
    ['/s?k=headphones', 'Search results'],
    ['/dp/B0QW7A2N9K', 'AeroSound QuietWave Pro Wireless Over-Ear Headphones with Adaptive Noise Cancelling, 45-Hour Battery and Multipoint Bluetooth'],
    ['/gp/cart/view.html', 'Shopping Cart'],
    ['/checkout/payment', 'Your cart is empty'],
    ['/order/success', 'No recent demo order found'],
    ['/missing', 'Page not found'],
  ])('renders %s', (path, heading) => {
    renderRoute(path);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it('handles an invalid product route gracefully', () => {
    renderRoute('/dp/example-product');

    expect(screen.getByRole('heading', { name: 'Product not found' })).toBeInTheDocument();
  });

  it('redirects the cart alias to the canonical cart route', async () => {
    renderRoute('/cart');

    expect(await screen.findByRole('heading', { name: 'Shopping Cart' })).toBeInTheDocument();
  });
});
