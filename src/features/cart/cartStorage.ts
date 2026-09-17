import { cartReducer, initialCartState, type CartLine, type CartState } from './cartReducer';

export const CART_STORAGE_KEY = 'amazon-clone-cart';

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== 'object') return false;
  const line = value as Partial<CartLine>;
  return typeof line.productId === 'string'
    && line.productId.length > 0
    && (line.variantId === undefined || typeof line.variantId === 'string')
    && typeof line.quantity === 'number'
    && Number.isInteger(line.quantity)
    && line.quantity > 0;
}

export function loadCartState(): CartState {
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return initialCartState;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as CartState).lines)) {
      return initialCartState;
    }

    return (parsed as CartState).lines
      .filter(isCartLine)
      .reduce(
        (state, line) => cartReducer(state, { type: 'itemAdded', line }),
        initialCartState,
      );
  } catch {
    return initialCartState;
  }
}

export function saveCartState(state: CartState) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ lines: state.lines }));
  } catch {
    // Shopping remains usable when storage is unavailable or over quota.
  }
}
