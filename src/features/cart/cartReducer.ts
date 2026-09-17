export interface CartLine {
  readonly productId: string;
  readonly variantId?: string;
  readonly quantity: number;
}

export interface CartState {
  readonly lines: readonly CartLine[];
}

interface CartLineIdentity {
  readonly productId: string;
  readonly variantId?: string;
}

export type CartAction =
  | { readonly type: 'itemAdded'; readonly line: CartLine }
  | ({ readonly type: 'itemQuantityChanged'; readonly quantity: number } & CartLineIdentity)
  | ({ readonly type: 'itemRemoved' } & CartLineIdentity)
  | { readonly type: 'cartCleared' };

export const initialCartState: CartState = { lines: [] };

function isMatchingLine(current: CartLine, identity: CartLineIdentity) {
  return current.productId === identity.productId && current.variantId === identity.variantId;
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === 'cartCleared') {
    return state.lines.length === 0 ? state : initialCartState;
  }

  if (action.type === 'itemRemoved') {
    const lines = state.lines.filter((line) => !isMatchingLine(line, action));
    return lines.length === state.lines.length ? state : { lines };
  }

  if (action.type === 'itemQuantityChanged') {
    const quantity = Math.floor(action.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) return state;

    let changed = false;
    const lines = state.lines.map((line) => {
      if (!isMatchingLine(line, action) || line.quantity === quantity) return line;
      changed = true;
      return { ...line, quantity };
    });
    return changed ? { lines } : state;
  }

  const quantity = Math.floor(action.line.quantity);
  if (!action.line.productId || !Number.isFinite(quantity) || quantity < 1) return state;

  const matchingIndex = state.lines.findIndex((line) => isMatchingLine(line, action.line));

  if (matchingIndex >= 0) {
    return {
      lines: state.lines.map((line, index) => (
        index === matchingIndex
          ? { ...line, quantity: line.quantity + quantity }
          : line
      )),
    };
  }

  const line: CartLine = {
    productId: action.line.productId,
    ...(action.line.variantId !== undefined ? { variantId: action.line.variantId } : {}),
    quantity,
  };

  return { lines: [...state.lines, line] };
}

export function getCartItemCount(state: CartState) {
  return state.lines.reduce((total, line) => total + line.quantity, 0);
}
