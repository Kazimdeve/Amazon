import { createContext } from 'react';
import type { CartLine, CartState } from './cartReducer';

export interface CartContextValue {
  readonly lines: CartState['lines'];
  readonly itemCount: number;
  readonly addItem: (line: CartLine) => void;
  readonly changeQuantity: (line: CartLine) => void;
  readonly removeItem: (line: Omit<CartLine, 'quantity'>) => void;
  readonly clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);
