import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { routes } from '../../../app/router';

function renderSearch(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('SearchResultsPage', () => {
  it('shows matching product data and the search context', () => {
    renderSearch('/s?k=wireless+headphones');

    expect(screen.getByText(/results for/i)).toHaveTextContent('“wireless headphones”');
    const heading = screen.getByRole('heading', { name: /AeroSound QuietWave Pro Wireless/i });
    const result = heading.closest('article');
    expect(result).not.toBeNull();
    expect(within(result!).getByText('3K+ bought in past month')).toBeInTheDocument();
    expect(within(result!).getByLabelText('Prime eligible')).toBeInTheDocument();
    expect(within(result!).getByText('FREE delivery tomorrow')).toBeInTheDocument();
  });

  it('navigates from a product title to its canonical product route', async () => {
    const user = userEvent.setup();
    const router = renderSearch('/s?k=headphones');

    await user.click(
      screen.getAllByRole('link', { name: /AeroSound QuietWave Pro Wireless/i })[0],
    );

    expect(router.state.location.pathname).toBe('/dp/B0QW7A2N9K');
  });

  it('shows a useful no-results state', () => {
    renderSearch('/s?k=moon-powered+typewriter');

    expect(
      screen.getByRole('heading', { name: 'No results for “moon-powered typewriter”' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/using fewer, more general words/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shop Electronics' })).toBeInTheDocument();
  });

  it('reproduces combined filter and sorting state from the URL', () => {
    renderSearch(
      '/s?k=electronics&category=electronics&prime=true&rating=4.5&minPrice=30&maxPrice=150&sort=price-asc',
    );

    const results = document.querySelectorAll('[data-search-result]');
    expect(results).toHaveLength(2);
    expect(results[0]).toHaveTextContent('NovaLink 65W GaN USB-C Charger');
    expect(results[1]).toHaveTextContent('AeroSound QuietWave Pro');
    expect(screen.getByLabelText('Sort results')).toHaveValue('price-asc');
    expect(screen.getByRole('navigation', { name: 'Active filters' })).toHaveTextContent(
      'Electronics',
    );
  });

  it('writes sorting to the URL and restores featured order when cleared', async () => {
    const user = userEvent.setup();
    const router = renderSearch('/s');
    const sort = screen.getByLabelText('Sort results');

    await user.selectOptions(sort, 'price-asc');
    expect(router.state.location.search).toBe('?sort=price-asc');
    expect(document.querySelector('[data-search-result] h2')).toHaveTextContent(
      'DewBalance Gentle Daily Face Cleanser',
    );

    await user.selectOptions(sort, 'featured');
    expect(router.state.location.search).toBe('');
    expect(document.querySelector('[data-search-result] h2')).toHaveTextContent(
      'AeroSound QuietWave Pro',
    );
  });

  it('uses history entries for filters and supports browser back and forward', async () => {
    const user = userEvent.setup();
    const router = renderSearch('/s?k=electronics');
    const filters = screen.getByRole('complementary', { name: 'Search filters' });

    await user.click(within(filters).getByRole('link', { name: /Electronics \(/ }));
    expect(router.state.location.search).toContain('category=electronics');

    await user.click(within(filters).getByRole('link', { name: 'Prime only' }));
    expect(router.state.location.search).toContain('prime=true');

    await router.navigate(-1);
    await waitFor(() => expect(router.state.location.search).not.toContain('prime=true'));
    expect(router.state.location.search).toContain('category=electronics');

    await router.navigate(1);
    await waitFor(() => expect(router.state.location.search).toContain('prime=true'));
  });

});
