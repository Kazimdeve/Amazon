import { describe, expect, it } from 'vitest';
import { COMPLETED_ORDER_STORAGE_KEY, loadCompletedOrder } from './orderStorage';

describe('completed order storage', () => {
  it('rejects a corrupt item instead of exposing it to the success page', () => {
    sessionStorage.setItem(COMPLETED_ORDER_STORAGE_KEY, JSON.stringify({
      id: 'ORDER-12345678',
      placedAt: new Date().toISOString(),
      paymentMethod: 'Demo card ending in 4242',
      items: [null],
      itemCount: 1,
      subtotalCents: 100,
      savingsCents: 0,
      totalCents: 100,
    }));

    expect(loadCompletedOrder()).toBeNull();
  });
});
