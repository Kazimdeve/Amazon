import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { HomePage } from './HomePage';

describe('HomePage hero', () => {
  it('renders an Amazon-style promotional hero with linked merchandising', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Everyday upgrades, delivered' })).toBeVisible();
    expect(
      screen.getByRole('img', {
        name: 'Everyday essentials arranged for home, work, and life on the go',
      }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Explore everyday favorites' })).toHaveAttribute(
      'href',
      '/dp/B0QW7A2N9K',
    );
    expect(container.querySelectorAll('[data-merch-card]')).toHaveLength(4);
    expect(screen.getByRole('heading', { name: 'Top picks for you' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Refresh your space' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Deals worth a look' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'More ways to discover' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Shopping benefits' })).toBeVisible();
    expect(container.querySelectorAll('[data-product-card]')).toHaveLength(9);
    expect(screen.getAllByRole('link', { name: /AeroSound QuietWave Pro/i })[0]).toHaveAttribute(
      'href',
      '/dp/B0QW7A2N9K',
    );
  });
});
