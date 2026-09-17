import { describe, expect, it } from 'vitest';
import { catalog } from '../../data/catalog';
import { findCategoryById, findProductById, getProductsByCategory } from './catalogSelectors';

describe('catalog selectors', () => {
  it('finds a product by its route-safe ID', () => {
    const product = findProductById('B0QW7A2N9K');

    expect(product?.brand).toBe('AeroSound');
  });

  it('returns undefined for an unknown product', () => {
    expect(findProductById('UNKNOWN')).toBeUndefined();
  });

  it('finds category metadata by ID', () => {
    expect(findCategoryById('home-kitchen')?.name).toBe('Home & Kitchen');
    expect(findCategoryById('not-a-category')).toBeUndefined();
  });

  it('returns only products in the selected category', () => {
    const electronics = getProductsByCategory('electronics');

    expect(electronics).toHaveLength(4);
    expect(electronics.every((product) => product.category === 'electronics')).toBe(true);
    expect(electronics.length).toBeLessThan(catalog.length);
  });
});
