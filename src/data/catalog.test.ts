import { describe, expect, it } from 'vitest';
import { catalog } from './catalog';
import { categories } from './categories';
import { homepageConfig } from './homepage';
import { filterAndSortProducts, parseSearchState } from '../features/search/searchResults';

describe('static catalog', () => {
  it('contains a focused set of unique products across every configured category', () => {
    expect(catalog).toHaveLength(26);
    expect(new Set(catalog.map((product) => product.id)).size).toBe(catalog.length);
    expect(new Set(catalog.map((product) => product.slug)).size).toBe(catalog.length);

    for (const category of categories) {
      expect(catalog.some((product) => product.category === category.id)).toBe(true);
    }
  });

  it('uses URL-safe product identifiers and complete commerce data', () => {
    const categoryIds = new Set<string>(categories.map((category) => category.id));

    for (const product of catalog) {
      expect(product.id).toMatch(/^[A-Z0-9]{10}$/);
      expect(product.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(categoryIds.has(product.category) || product.category === 'specialty').toBe(true);
      expect(Number.isInteger(product.priceCents)).toBe(true);
      expect(Number.isInteger(product.listPriceCents)).toBe(true);
      expect(product.priceCents).toBeGreaterThan(0);
      expect(product.listPriceCents).toBeGreaterThanOrEqual(product.priceCents);
      expect(product.rating).toBeGreaterThanOrEqual(0);
      expect(product.rating).toBeLessThanOrEqual(5);
      expect(product.reviewCount).toBeGreaterThanOrEqual(0);
      expect(product.boughtPastMonth).toBeGreaterThanOrEqual(0);
      expect(product.images.length).toBeGreaterThan(0);
      expect(product.features.length).toBeGreaterThan(0);
      expect(Object.keys(product.specifications).length).toBeGreaterThan(0);
      expect(product.variants.length).toBeGreaterThan(0);
      expect(new Set(product.variants.map((variant) => variant.id)).size).toBe(
        product.variants.length,
      );

      for (const image of product.images) {
        expect(image).toMatch(/^https:\/\//);
        expect(image).not.toMatch(/amazon|media-amazon/i);
      }

      for (const variant of product.variants) {
        if ('priceCents' in variant && variant.priceCents !== undefined) {
          expect(Number.isInteger(variant.priceCents)).toBe(true);
          expect(variant.priceCents).toBeGreaterThan(0);
        }
      }
    }
  });

  it('only references valid products and categories from homepage configuration', () => {
    const productIds = new Set<string>(catalog.map((product) => product.id));
    const categoryIds = new Set<string>(categories.map((category) => category.id));

    expect(productIds.has(homepageConfig.hero.productId)).toBe(true);

    for (const section of homepageConfig.sections) {
      if (section.type === 'product-rail') {
        for (const productId of section.productIds) {
          expect(productIds.has(productId)).toBe(true);
        }
      } else {
        for (const categoryId of section.categoryIds) {
          expect(categoryIds.has(categoryId)).toBe(true);
        }
      }
    }
  });

  it('returns products for every secondary navigation collection', () => {
    const secondaryLinks = [
      'Medical Care',
      'Amazon Basics',
      'Best Sellers',
      "Today's Deals",
      'New Releases',
      'Prime',
      'Books',
      'Registry',
      'Gift Cards',
      'Groceries',
      'Smart Home',
      'Customer Service',
    ];

    for (const label of secondaryLinks) {
      const results = filterAndSortProducts(
        catalog,
        parseSearchState(new URLSearchParams({ k: label })),
      );
      expect(results.length, label).toBeGreaterThan(0);
      expect(results.every((product) => product.id)).toBe(true);
    }
  });
});
