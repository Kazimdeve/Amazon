import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AmazonFooter } from './AmazonFooter';

function renderFooter() {
  return render(
    <MemoryRouter>
      <AmazonFooter />
    </MemoryRouter>,
  );
}

describe('AmazonFooter', () => {
  it('renders the recognizable Amazon footer hierarchy', () => {
    renderFooter();

    const footer = screen.getByRole('contentinfo', { name: 'Amazon footer' });
    expect(within(footer).getByRole('link', { name: 'Back to top' })).toHaveAttribute(
      'href',
      '#root',
    );
    expect(within(footer).getByRole('navigation', { name: 'Footer navigation' })).toBeVisible();
    expect(within(footer).getByRole('navigation', { name: 'Amazon services' })).toBeVisible();
    expect(within(footer).getByRole('navigation', { name: 'Legal' })).toBeVisible();
  });

  it('renders four link groups and locale controls', () => {
    const { container } = renderFooter();

    expect(container.querySelectorAll('[data-footer-column]')).toHaveLength(4);
    expect(screen.getByRole('heading', { name: 'Get to Know Us' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Make Money with Us' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Amazon Payment Products' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Let Us Help You' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'English' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'United States' })).toBeVisible();
  });
});
