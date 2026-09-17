import { describe, expect, it } from 'vitest';
import { cartReducer, getCartItemCount, initialCartState, type CartState } from './cartReducer';

describe('cartReducer', () => {
  it('adds a normalized cart line', () => {
    const state = cartReducer(initialCartState, {
      type: 'itemAdded',
      line: { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 2 },
    });

    expect(state.lines).toEqual([
      { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 2 },
    ]);
    expect(Object.keys(state.lines[0])).toEqual(['productId', 'variantId', 'quantity']);
  });

  it('merges repeated additions for the same product and variant', () => {
    const existing: CartState = {
      lines: [{ productId: 'B0QW7A2N9K', variantId: 'black', quantity: 2 }],
    };
    const state = cartReducer(existing, {
      type: 'itemAdded',
      line: { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 3 },
    });

    expect(state.lines).toEqual([
      { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 5 },
    ]);
    expect(existing.lines[0].quantity).toBe(2);
  });

  it('keeps different variants as separate lines', () => {
    const existing: CartState = {
      lines: [{ productId: 'B0QW7A2N9K', variantId: 'black', quantity: 1 }],
    };
    const state = cartReducer(existing, {
      type: 'itemAdded',
      line: { productId: 'B0QW7A2N9K', variantId: 'sand', quantity: 2 },
    });

    expect(state.lines).toHaveLength(2);
    expect(getCartItemCount(state)).toBe(3);
  });

  it('merges products without variants and ignores invalid quantities', () => {
    const first = cartReducer(initialCartState, {
      type: 'itemAdded',
      line: { productId: 'simple-product', quantity: 1 },
    });
    const merged = cartReducer(first, {
      type: 'itemAdded',
      line: { productId: 'simple-product', quantity: 2 },
    });
    const unchanged = cartReducer(merged, {
      type: 'itemAdded',
      line: { productId: 'simple-product', quantity: 0 },
    });

    expect(merged.lines).toEqual([{ productId: 'simple-product', quantity: 3 }]);
    expect(unchanged).toBe(merged);
  });

  it('changes a matching line quantity without affecting other variants', () => {
    const existing: CartState = {
      lines: [
        { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 1 },
        { productId: 'B0QW7A2N9K', variantId: 'sand', quantity: 2 },
      ],
    };
    const state = cartReducer(existing, {
      type: 'itemQuantityChanged',
      productId: 'B0QW7A2N9K',
      variantId: 'black',
      quantity: 4,
    });

    expect(state.lines).toEqual([
      { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 4 },
      { productId: 'B0QW7A2N9K', variantId: 'sand', quantity: 2 },
    ]);
  });

  it('removes only the matching product and variant line', () => {
    const existing: CartState = {
      lines: [
        { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 1 },
        { productId: 'B0QW7A2N9K', variantId: 'sand', quantity: 2 },
      ],
    };
    const state = cartReducer(existing, {
      type: 'itemRemoved',
      productId: 'B0QW7A2N9K',
      variantId: 'black',
    });

    expect(state.lines).toEqual([
      { productId: 'B0QW7A2N9K', variantId: 'sand', quantity: 2 },
    ]);
  });

  it('clears every line after a completed order', () => {
    const existing: CartState = {
      lines: [
        { productId: 'B0QW7A2N9K', variantId: 'black', quantity: 1 },
        { productId: 'B0CH4R65PD', variantId: 'with-cable', quantity: 2 },
      ],
    };

    expect(cartReducer(existing, { type: 'cartCleared' })).toEqual(initialCartState);
  });
});
