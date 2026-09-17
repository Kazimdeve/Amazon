import { type ReactNode, useCallback, useEffect, useMemo, useReducer } from 'react';
import { CartContext } from './cartContextValue';
import {
  cartReducer,
  getCartItemCount,
  initialCartState,
  type CartLine,
} from './cartReducer';
import { loadCartState, saveCartState } from './cartStorage';

export function CartProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState, loadCartState);
  const addItem = useCallback((line: CartLine) => {
    dispatch({ type: 'itemAdded', line });
  }, []);
  const changeQuantity = useCallback((line: CartLine) => {
    dispatch({ type: 'itemQuantityChanged', ...line });
  }, []);
  const removeItem = useCallback((line: Omit<CartLine, 'quantity'>) => {
    dispatch({ type: 'itemRemoved', ...line });
  }, []);
  const clearCart = useCallback(() => {
    dispatch({ type: 'cartCleared' });
  }, []);
  const itemCount = getCartItemCount(state);

  useEffect(() => saveCartState(state), [state]);

  const value = useMemo(
    () => ({ lines: state.lines, itemCount, addItem, changeQuantity, removeItem, clearCart }),
    [addItem, changeQuantity, clearCart, itemCount, removeItem, state.lines],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
