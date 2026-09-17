import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routes } from '../../../app/router';

function renderProduct(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(<RouterProvider router={router} />);
  return { router, ...view };
}

describe('ProductDetailsPage', () => {
  it('renders the dense three-part product detail foundation', () => {
    const { container } = renderProduct('/dp/B0QW7A2N9K');

    expect(
      screen.getByRole('heading', { name: /AeroSound QuietWave Pro Wireless/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Product gallery' })).toBeInTheDocument();
    expect(screen.getByAltText(/AeroSound QuietWave Pro Wireless/i)).toHaveAttribute(
      'src',
      '/products/B0QW7A2N9K.jpg',
    );
    expect(screen.getByRole('complementary', { name: 'Purchase options' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Product information' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About this item' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent(
      'Electronics',
    );
    expect(container.querySelector('[data-product-layout]')).toBeInTheDocument();
  });

  it('updates summary and purchase prices when a priced variant is selected', async () => {
    const user = userEvent.setup();
    const { container } = renderProduct('/dp/B0CH4R65PD');

    const summary = container.querySelector<HTMLElement>('[data-product-summary]');
    const buyBox = screen.getByRole('complementary', { name: 'Purchase options' });
    const cableVariant = screen.getByRole('radio', { name: /With 6 ft USB-C cable/i });

    expect(summary).not.toBeNull();
    expect(within(summary!).getByLabelText('$34.99')).toBeInTheDocument();
    expect(within(buyBox).getByLabelText('$34.99')).toBeInTheDocument();

    await user.click(cableVariant);

    expect(cableVariant).toHaveAttribute('aria-checked', 'true');
    expect(within(summary!).getByLabelText('$42.99')).toBeInTheDocument();
    expect(within(buyBox).getByLabelText('$42.99')).toBeInTheDocument();
  });

  it('switches thumbnails with different proportions in a stable image frame', async () => {
    const user = userEvent.setup();
    renderProduct('/dp/B0QW7A2N9K');

    const imageFrame = screen.getByAltText(/image 1 of 3/i);
    const secondThumbnail = screen.getByRole('button', { name: 'View product image 2 of 3' });
    await user.click(secondThumbnail);

    expect(secondThumbnail).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByAltText(/image 2 of 3/i)).toBe(imageFrame);
    expect(imageFrame).toHaveAttribute(
      'src',
      expect.stringContaining('photo-1505740420928-5e560c06d30e'),
    );

    await user.click(screen.getByRole('button', { name: 'View product image 3 of 3' }));
    expect(screen.getByAltText(/image 3 of 3/i)).toBe(imageFrame);
    expect(imageFrame).toHaveAttribute(
      'src',
      expect.stringContaining('w=900&h=1200'),
    );
  });

  it('supports arrow-key selection for thumbnails and variants', async () => {
    const user = userEvent.setup();
    renderProduct('/dp/B0QW7A2N9K');

    const firstThumbnail = screen.getByRole('button', { name: 'View product image 1 of 3' });
    firstThumbnail.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'View product image 2 of 3' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'View product image 2 of 3' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const blackVariant = screen.getByRole('radio', { name: 'Midnight Black' });
    blackVariant.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Soft Sand' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByAltText(/image 3 of 3/i)).toHaveAttribute(
      'src',
      expect.stringContaining('photo-1484704849700-f032a568e944'),
    );
  });

  it('falls back to the product image when a variant has no image', async () => {
    const user = userEvent.setup();
    renderProduct('/dp/B0QW7A2N9K');

    await user.click(screen.getByRole('radio', { name: 'Soft Sand' }));
    await user.click(screen.getByRole('radio', { name: 'Midnight Black' }));

    expect(screen.getByAltText(/image 1 of 3/i)).toHaveAttribute(
      'src',
      '/products/B0QW7A2N9K.jpg',
    );
  });

  it('adds the selected quantity to the cart and updates the header immediately', async () => {
    const user = userEvent.setup();
    renderProduct('/dp/B0QW7A2N9K');

    const buyBox = screen.getByRole('complementary', { name: 'Purchase options' });
    await user.selectOptions(within(buyBox).getByRole('combobox', { name: 'Quantity:' }), '2');
    await user.click(within(buyBox).getByRole('button', { name: 'Add to Cart' }));

    expect(screen.getByRole('link', { name: 'Cart, 2 items' })).toBeInTheDocument();
    expect(within(buyBox).getByRole('status')).toHaveTextContent(
      'Added to Cart — 2 items added. 2 items in cart.',
    );

    await user.click(within(buyBox).getByRole('button', { name: 'Add to Cart' }));
    expect(screen.getByRole('link', { name: 'Cart, 4 items' })).toBeInTheDocument();
    expect(within(buyBox).getByRole('status')).toHaveTextContent('4 items in cart');
  });

  it('adds selected variants as distinct cart choices', async () => {
    const user = userEvent.setup();
    renderProduct('/dp/B0CH4R65PD');

    const buyBox = screen.getByRole('complementary', { name: 'Purchase options' });
    await user.click(within(buyBox).getByRole('button', { name: 'Add to Cart' }));
    await user.click(screen.getByRole('radio', { name: /With 6 ft USB-C cable/i }));
    await user.click(within(buyBox).getByRole('button', { name: 'Add to Cart' }));

    expect(screen.getByRole('link', { name: 'Cart, 2 items' })).toBeInTheDocument();
  });

  it('adds the selected product and opens payment when Buy Now is selected', async () => {
    const user = userEvent.setup();
    localStorage.clear();
    const { router } = renderProduct('/dp/B0QW7A2N9K');

    await user.click(screen.getByRole('button', { name: 'Buy Now' }));

    expect(router.state.location.pathname).toBe('/checkout/payment');
    expect(screen.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    expect(localStorage.getItem('amazon-clone-cart')).toContain('B0QW7A2N9K');
  });

  it('handles unknown product IDs without crashing', () => {
    renderProduct('/dp/not-a-real-product');

    expect(screen.getByRole('heading', { name: 'Product not found' })).toBeInTheDocument();
    expect(screen.getByText('not-a-real-product')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse all products' })).toHaveAttribute('href', '/s');
  });
});
