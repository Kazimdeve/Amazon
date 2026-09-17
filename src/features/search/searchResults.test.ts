import { describe, expect, it } from 'vitest';
import { catalog } from '../../data/catalog';
import { countActiveFilters, filterAndSortProducts, parseSearchState } from './searchResults';

describe('search filtering and sorting', () => {
  it('parses supported URL parameters and ignores invalid values', () => {
    const state = parseSearchState(
      new URLSearchParams(
        'k=usb+c&category=electronics&prime=true&rating=4.5&minPrice=30&maxPrice=150&sort=price-desc',
      ),
    );

    expect(state).toEqual({
      query: 'usb c',
      category: 'electronics',
      primeOnly: true,
      minimumRating: 4.5,
      minimumPriceCents: 3000,
      maximumPriceCents: 15000,
      sort: 'price-desc',
    });
    expect(countActiveFilters(state)).toBe(4);

    expect(parseSearchState(new URLSearchParams('category=wrong&rating=9&minPrice=-2&sort=nope')))
      .toEqual({
        query: '',
        category: undefined,
        primeOnly: false,
        minimumRating: undefined,
        minimumPriceCents: undefined,
        maximumPriceCents: undefined,
        sort: 'featured',
      });
  });

  it('combines query, category, Prime, rating, and inclusive price filters', () => {
    const state = parseSearchState(
      new URLSearchParams(
        'k=electronics&category=electronics&prime=true&rating=4.5&minPrice=30&maxPrice=150&sort=price-asc',
      ),
    );
    const results = filterAndSortProducts(catalog, state);

    expect(results.map((product) => product.id)).toEqual(['B0CH4R65PD', 'B0QW7A2N9K']);
  });

  it('supports every sorting mode', () => {
    const firstId = (params: string) =>
      filterAndSortProducts(catalog, parseSearchState(new URLSearchParams(params)))[0]?.id;

    expect(firstId('sort=featured')).toBe('B0QW7A2N9K');
    expect(firstId('sort=price-asc')).toBe('B0DB5CLNSR');
    expect(firstId('sort=price-desc')).toBe('B0LM27QHD8');
    expect(firstId('sort=rating')).toBe('B0SF32BTTL');

    const relevanceIds = filterAndSortProducts(
      catalog,
      parseSearchState(new URLSearchParams('k=usb+c&sort=relevance')),
    ).map((product) => product.id);
    expect(relevanceIds).toHaveLength(4);
    expect(relevanceIds.slice(0, 2)).toEqual(['B0LA7DESK2', 'B0CH4R65PD']);
  });

  it('returns an empty collection for incompatible filter combinations', () => {
    const results = filterAndSortProducts(
      catalog,
      parseSearchState(
        new URLSearchParams('k=headphones&category=office&prime=true&rating=4.5&maxPrice=50'),
      ),
    );

    expect(results).toEqual([]);
  });
});
