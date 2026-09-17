import { describe, expect, it, vi } from 'vitest';
import { initialCartState } from './cartReducer';
import { saveCartState } from './cartStorage';

describe('cart storage', () => {
  it('keeps the app usable when localStorage rejects a write', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable');
    });

    expect(() => saveCartState(initialCartState)).not.toThrow();
    setItem.mockRestore();
  });
});
