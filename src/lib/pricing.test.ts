import { describe, expect, it } from 'vitest';
import { calculateSavings } from './pricing';

describe('calculateSavings', () => {
  it('returns the amount and rounded percentage saved', () => {
    expect(calculateSavings(12999, 17999)).toEqual({
      amountCents: 5000,
      percentage: 28,
    });
  });

  it('returns null when there is no discount', () => {
    expect(calculateSavings(5000, 5000)).toBeNull();
    expect(calculateSavings(6000, 5000)).toBeNull();
  });

  it('rejects invalid price values', () => {
    expect(() => calculateSavings(999.5, 1200)).toThrow(TypeError);
    expect(() => calculateSavings(-100, 1200)).toThrow(RangeError);
  });
});
