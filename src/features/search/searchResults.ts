import { categories } from '../../data/categories';
import type { CategoryId, Product } from '../catalog/types';

export type SearchSort = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'featured';

export interface SearchState {
  readonly query: string;
  readonly category?: CategoryId;
  readonly primeOnly: boolean;
  readonly minimumRating?: number;
  readonly minimumPriceCents?: number;
  readonly maximumPriceCents?: number;
  readonly sort: SearchSort;
}

const categoryNames = new Map<string, string>(categories.map((category) => [category.id, category.name]));
const validSorts: readonly SearchSort[] = [
  'relevance',
  'price-asc',
  'price-desc',
  'rating',
  'featured',
];

const badgeSearchTerms: Record<string, string> = {
  'amazon-choice': "Amazon's Choice",
  'best-seller': 'Best Sellers Best Seller',
  'limited-time-deal': "Today's Deals Deals",
  'climate-pledge-friendly': 'Climate Pledge Friendly',
  'small-business': 'Small Business',
};

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseMoney(value: string | null) {
  if (value === null || value.trim() === '') return undefined;
  const dollars = Number(value);
  return Number.isFinite(dollars) && dollars >= 0 ? Math.round(dollars * 100) : undefined;
}

function parseRating(value: string | null) {
  if (value === null || value.trim() === '') return undefined;
  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : undefined;
}

export function parseSearchState(searchParams: URLSearchParams): SearchState {
  const requestedCategory = searchParams.get('category');
  const category = categories.some((item) => item.id === requestedCategory)
    ? (requestedCategory as CategoryId)
    : undefined;
  const requestedSort = searchParams.get('sort') as SearchSort | null;

  return {
    query: searchParams.get('k')?.trim() ?? '',
    category,
    primeOnly: searchParams.get('prime') === 'true',
    minimumRating: parseRating(searchParams.get('rating')),
    minimumPriceCents: parseMoney(searchParams.get('minPrice')),
    maximumPriceCents: parseMoney(searchParams.get('maxPrice')),
    sort: requestedSort && validSorts.includes(requestedSort) ? requestedSort : 'featured',
  };
}

export function productMatchesQuery(product: Product, query: string) {
  const terms = normalize(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;

  const searchableText = normalize(
    [
      product.title,
      product.brand,
      categoryNames.get(product.category) ?? '',
      ...product.features,
      ...Object.values(product.specifications),
      ...(product.searchTags ?? []),
      product.prime ? 'Prime' : '',
      ...product.badges.map((badge) => badgeSearchTerms[badge] ?? badge),
    ].join(' '),
  );

  return terms.every((term) => searchableText.includes(term));
}

function relevanceScore(product: Product, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;

  const terms = normalizedQuery.split(' ').filter(Boolean);
  const title = normalize(product.title);
  const brand = normalize(product.brand);
  const category = normalize(categoryNames.get(product.category) ?? '');
  const features = normalize(product.features.join(' '));
  const specifications = normalize(Object.values(product.specifications).join(' '));
  let score = title.includes(normalizedQuery) ? 40 : 0;

  if (title.startsWith(normalizedQuery)) score += 20;
  for (const term of terms) {
    if (title.includes(term)) score += 10;
    if (brand.includes(term)) score += 8;
    if (category.includes(term)) score += 6;
    if (features.includes(term)) score += 2;
    if (specifications.includes(term)) score += 1;
  }

  return score;
}

export function filterAndSortProducts(
  products: readonly Product[],
  state: SearchState,
): Product[] {
  const filteredProducts = products.filter((product) => {
    if (!productMatchesQuery(product, state.query)) return false;
    if (state.category && product.category !== state.category) return false;
    if (state.primeOnly && !product.prime) return false;
    if (state.minimumRating !== undefined && product.rating < state.minimumRating) return false;
    if (
      state.minimumPriceCents !== undefined &&
      product.priceCents < state.minimumPriceCents
    ) return false;
    if (
      state.maximumPriceCents !== undefined &&
      product.priceCents > state.maximumPriceCents
    ) return false;
    return true;
  });

  if (state.sort === 'featured') return filteredProducts;

  return [...filteredProducts].sort((first, second) => {
    if (state.sort === 'price-asc') return first.priceCents - second.priceCents;
    if (state.sort === 'price-desc') return second.priceCents - first.priceCents;
    if (state.sort === 'rating') {
      return second.rating - first.rating || second.reviewCount - first.reviewCount;
    }

    return (
      relevanceScore(second, state.query) - relevanceScore(first, state.query) ||
      second.reviewCount - first.reviewCount
    );
  });
}

export function countActiveFilters(state: SearchState) {
  return [
    state.category,
    state.primeOnly || undefined,
    state.minimumRating,
    state.minimumPriceCents !== undefined || state.maximumPriceCents !== undefined
      ? true
      : undefined,
  ].filter(Boolean).length;
}
