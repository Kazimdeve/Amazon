import { describe, expect, it } from 'vitest';
import { formatCardNumber, formatExpiry, validateCardFields } from './cardValidation';

describe('demo card validation', () => {
  it('formats card and expiry input without retaining non-digits', () => {
    expect(formatCardNumber('4242-4242 abc 4242 4242')).toBe('4242 4242 4242 4242');
    expect(formatExpiry('12 / 30')).toBe('12/30');
  });

  it('requires every card field', () => {
    expect(validateCardFields(
      { cardholderName: '', cardNumber: '', expiry: '', cvv: '' },
      new Date('2026-09-17T00:00:00Z'),
    )).toEqual({
      cardholderName: 'Enter the cardholder name.',
      cardNumber: 'Enter a test card number.',
      expiry: 'Enter an expiry date.',
      cvv: 'Enter a CVV.',
    });
  });

  it('rejects unknown, expired, invalid-month, and invalid-CVV values', () => {
    expect(validateCardFields(
      { cardholderName: 'Test User', cardNumber: '1111 2222 3333 4444', expiry: '08/26', cvv: '12' },
      new Date('2026-09-17T00:00:00Z'),
    )).toEqual({
      cardNumber: 'Use one of the test card numbers shown below.',
      expiry: 'This expiry date has passed.',
      cvv: 'Enter a 3-digit CVV.',
    });

    expect(validateCardFields(
      { cardholderName: 'Test User', cardNumber: '4242424242424242', expiry: '13/30', cvv: '123' },
      new Date('2026-09-17T00:00:00Z'),
    ).expiry).toBe('Enter a valid month.');
  });

  it('accepts both published test cards with a valid future expiry', () => {
    for (const cardNumber of ['4242 4242 4242 4242', '4000 0000 0000 0002']) {
      expect(validateCardFields(
        { cardholderName: 'Test User', cardNumber, expiry: '12/30', cvv: '123' },
        new Date('2026-09-17T00:00:00Z'),
      )).toEqual({});
    }
  });
});
