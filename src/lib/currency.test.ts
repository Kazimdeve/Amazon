import { describe, expect, it } from 'vitest';
import { formatCurrency } from './currency';

describe('formatCurrency', () => {
  it('formats integer cents as US dollars by default', () => {
    expect(formatCurrency(12999)).toBe('$129.99');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('supports alternate locales and currencies', () => {
    expect(formatCurrency(12999, 'en-GB', 'GBP')).toBe('£129.99');
  });

  it('rejects fractional cent values', () => {
    expect(() => formatCurrency(1299.5)).toThrow(TypeError);
  });
});
