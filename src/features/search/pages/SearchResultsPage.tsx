import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { catalog } from '../../../data/catalog';
import { categories } from '../../../data/categories';
import { formatCurrency } from '../../../lib/currency';
import { recoverImage } from '../../../lib/imageFallback';
import { calculateSavings } from '../../../lib/pricing';
import type { CategoryId, Product, ProductBadge } from '../../catalog/types';
import {
  countActiveFilters,
  filterAndSortProducts,
  parseSearchState,
  type SearchSort,
  type SearchState,
} from '../searchResults';
import styles from './SearchResultsPage.module.css';

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const badgeLabels: Record<ProductBadge, string> = {
  'amazon-choice': "Amazon's Choice",
  'best-seller': '#1 Best Seller',
  'climate-pledge-friendly': 'Climate Pledge Friendly',
  'limited-time-deal': 'Limited time deal',
  'small-business': 'Small Business',
};

function StarRating({
  productPath,
  rating,
  reviewCount,
}: {
  productPath: string;
  rating: number;
  reviewCount: number;
}) {
  return (
    <div className={styles.ratingRow}>
      <span>{rating.toFixed(1)}</span>
      <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>
        <span className={styles.emptyStars} aria-hidden="true">★★★★★</span>
        <span
          className={styles.filledStars}
          style={{ inlineSize: `${(rating / 5) * 100}%` }}
          aria-hidden="true"
        >
          ★★★★★
        </span>
      </span>
      <Link
        className={styles.reviewCount}
        to={`${productPath}#reviews`}
        aria-label={`${reviewCount.toLocaleString()} ratings`}
      >
        {reviewCount.toLocaleString()}
      </Link>
    </div>
  );
}

function PrimeMark() {
  return (
    <span className={styles.prime} aria-label="Prime eligible">
      <svg viewBox="0 0 18 12" aria-hidden="true"><path d="m1 6 4 4L16 1" /></svg>
      prime
    </span>
  );
}

function Price({ cents }: { cents: number }) {
  const dollars = Math.floor(cents / 100).toLocaleString('en-US');
  const fraction = String(cents % 100).padStart(2, '0');
  return (
    <span className={styles.price} aria-label={formatCurrency(cents)}>
      <sup>$</sup><span>{dollars}</span><sup>{fraction}</sup>
    </span>
  );
}

function ResultBadges({ badges }: { badges: readonly ProductBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className={styles.badges} aria-label="Product badges">
      {badges.map((badge) => (
        <span
          className={`${styles.badge} ${badge === 'climate-pledge-friendly' ? styles.sustainabilityBadge : ''}`}
          key={badge}
        >
          {badgeLabels[badge]}
        </span>
      ))}
    </div>
  );
}

function SearchResult({ product, index }: { product: Product; index: number }) {
  const savings = calculateSavings(product.priceCents, product.listPriceCents);
  const productPath = `/dp/${product.id}`;
  return (
    <article className={styles.result} data-search-result>
      <Link className={styles.imageLink} to={productPath} aria-label={product.title}>
        {index === 0 ? <span className={styles.sponsored}>Sponsored</span> : null}
        <img
          src={product.images[0]}
          alt={product.title}
          loading={index < 2 ? 'eager' : 'lazy'}
          onError={(event) => recoverImage(event.currentTarget, `/products/${product.id}.jpg`)}
        />
      </Link>

      <div className={styles.productInfo}>
        <ResultBadges badges={product.badges} />
        <h2><Link to={productPath}>{product.title}</Link></h2>
        <p className={styles.brand}>Visit the {product.brand} Store</p>
        <StarRating
          productPath={productPath}
          rating={product.rating}
          reviewCount={product.reviewCount}
        />
        {product.boughtPastMonth > 0 ? (
          <p className={styles.salesSignal}>
            {compactNumber.format(product.boughtPastMonth)}+ bought in past month
          </p>
        ) : null}
        <p className={styles.feature}>{product.features[0]}</p>
      </div>

      <div className={styles.offerColumn}>
        {product.badges.includes('limited-time-deal') ? (
          <span className={styles.dealLabel}>Limited time deal</span>
        ) : null}
        <div className={styles.priceLine}>
          <Price cents={product.priceCents} />
          {savings ? <span className={styles.discount}>-{savings.percentage}%</span> : null}
        </div>
        {savings ? (
          <p className={styles.listPrice}>List: <span>{formatCurrency(product.listPriceCents)}</span></p>
        ) : null}
        {product.prime ? <PrimeMark /> : null}
        <p className={styles.delivery}>
          <strong>{product.delivery.standard}</strong>
          {product.delivery.expedited ? <span>{product.delivery.expedited}</span> : null}
        </p>
        {product.stock.status === 'low-stock' ? (
          <p className={styles.stockWarning}>{product.stock.message}</p>
        ) : null}
        <Link className={styles.cta} to={productPath} aria-label={`See options for ${product.title}`}>
          See options
        </Link>
      </div>
    </article>
  );
}

const ratingOptions = [4.5, 4, 3] as const;
const priceRanges = [
  { label: 'Under $25', minimum: undefined, maximum: 25 },
  { label: '$25 to $50', minimum: 25, maximum: 50 },
  { label: '$50 to $100', minimum: 50, maximum: 100 },
  { label: '$100 to $200', minimum: 100, maximum: 200 },
  { label: '$200 & above', minimum: 200, maximum: undefined },
] as const;

type ParameterUpdate = Record<string, string | null | undefined>;

function searchHref(searchParams: URLSearchParams, updates: ParameterUpdate) {
  const nextParams = new URLSearchParams(searchParams);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '') nextParams.delete(key);
    else nextParams.set(key, value);
  }
  const queryString = nextParams.toString();
  return queryString ? `/s?${queryString}` : '/s';
}

function buildSearchPath(query: string, category?: CategoryId) {
  const params = new URLSearchParams();
  if (query) params.set('k', query);
  if (category) params.set('category', category);
  return `/s?${params.toString()}`;
}

function CheckIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m2.5 8.5 3.2 3L13.5 4" /></svg>;
}

interface FilterPanelProps {
  readonly categoryCounts: ReadonlyMap<CategoryId, number>;
  readonly idPrefix: string;
  readonly onNavigate?: () => void;
  readonly onPriceApply: (minimum: string, maximum: string) => void;
  readonly searchParams: URLSearchParams;
  readonly state: SearchState;
}

function FilterPanel({
  categoryCounts,
  idPrefix,
  onNavigate,
  onPriceApply,
  searchParams,
  state,
}: FilterPanelProps) {
  const activePriceKey = `${state.minimumPriceCents ?? ''}-${state.maximumPriceCents ?? ''}`;

  function submitPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onPriceApply(String(formData.get('minimum') ?? ''), String(formData.get('maximum') ?? ''));
  }

  return (
    <div className={styles.filterPanel}>
      <section className={styles.filterSection} aria-labelledby={`${idPrefix}-department`}>
        <h3 id={`${idPrefix}-department`}>Department</h3>
        <ul>
          <li>
            <Link
              className={!state.category ? styles.activeDepartment : ''}
              to={searchHref(searchParams, { category: null })}
              aria-current={!state.category ? 'true' : undefined}
              onClick={onNavigate}
            >
              Any Department
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                className={state.category === category.id ? styles.activeDepartment : ''}
                to={searchHref(searchParams, { category: category.id })}
                aria-current={state.category === category.id ? 'true' : undefined}
                onClick={onNavigate}
              >
                {category.name} <span>({categoryCounts.get(category.id) ?? 0})</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.filterSection} aria-labelledby={`${idPrefix}-prime`}>
        <h3 id={`${idPrefix}-prime`}>Amazon Prime</h3>
        <Link
          className={`${styles.checkboxFilter} ${state.primeOnly ? styles.selectedFilter : ''}`}
          to={searchHref(searchParams, { prime: state.primeOnly ? null : 'true' })}
          aria-current={state.primeOnly ? 'true' : undefined}
          aria-label="Prime only"
          onClick={onNavigate}
        >
          <span className={styles.checkbox} aria-hidden="true">
            {state.primeOnly ? <CheckIcon /> : null}
          </span>
          <PrimeMark />
        </Link>
      </section>

      <section className={styles.filterSection} aria-labelledby={`${idPrefix}-rating`}>
        <h3 id={`${idPrefix}-rating`}>Customer Reviews</h3>
        <ul>
          {ratingOptions.map((rating) => {
            const selected = state.minimumRating === rating;
            return (
              <li key={rating}>
                <Link
                  className={`${styles.ratingFilter} ${selected ? styles.selectedFilter : ''}`}
                  to={searchHref(searchParams, { rating: selected ? null : String(rating) })}
                  aria-current={selected ? 'true' : undefined}
                  aria-label={`${rating} stars and up`}
                  onClick={onNavigate}
                >
                  <span aria-hidden="true">★★★★★</span>
                  <small>{rating} &amp; up</small>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.filterSection} aria-labelledby={`${idPrefix}-price`}>
        <h3 id={`${idPrefix}-price`}>Price</h3>
        <ul>
          {priceRanges.map((range) => {
            const minimumCents = range.minimum === undefined ? undefined : range.minimum * 100;
            const maximumCents = range.maximum === undefined ? undefined : range.maximum * 100;
            const selected =
              state.minimumPriceCents === minimumCents &&
              state.maximumPriceCents === maximumCents;
            return (
              <li key={range.label}>
                <Link
                  className={selected ? styles.selectedFilter : ''}
                  to={searchHref(searchParams, {
                    minPrice: selected ? null : range.minimum?.toString(),
                    maxPrice: selected ? null : range.maximum?.toString(),
                  })}
                  aria-current={selected ? 'true' : undefined}
                  onClick={onNavigate}
                >
                  {range.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <form className={styles.priceForm} key={activePriceKey} onSubmit={submitPrice}>
          <label>
            <span className={styles.visuallyHidden}>Minimum price</span>
            <span aria-hidden="true">$</span>
            <input
              type="number"
              name="minimum"
              min="0"
              step="1"
              inputMode="numeric"
              defaultValue={
                state.minimumPriceCents === undefined ? '' : state.minimumPriceCents / 100
              }
              placeholder="Min"
            />
          </label>
          <span aria-hidden="true">–</span>
          <label>
            <span className={styles.visuallyHidden}>Maximum price</span>
            <span aria-hidden="true">$</span>
            <input
              type="number"
              name="maximum"
              min="0"
              step="1"
              inputMode="numeric"
              defaultValue={
                state.maximumPriceCents === undefined ? '' : state.maximumPriceCents / 100
              }
              placeholder="Max"
            />
          </label>
          <button type="submit">Go</button>
        </form>
      </section>
    </div>
  );
}

function NoResults({ clearHref, query }: { clearHref?: string; query: string }) {
  return (
    <section className={styles.noResults} aria-labelledby="no-results-title">
      <svg className={styles.noResultsIcon} viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="34" cy="34" r="23" />
        <path d="m51 51 19 19M25 30h18M28 42h12" />
      </svg>
      <div>
        <h2 id="no-results-title">No results for “{query}”</h2>
        <p>Try checking your spelling or using fewer, more general words.</p>
        <div className={styles.suggestionLinks}>
          {clearHref ? <Link to={clearHref}>Clear filters</Link> : null}
          {categories.slice(0, 4).map((category) => (
            <Link to={buildSearchPath(category.name, category.id)} key={category.id}>
              Shop {category.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const closeFiltersRef = useRef<HTMLButtonElement>(null);
  const state = parseSearchState(searchParams);
  const results = filterAndSortProducts(catalog, state);
  const activeFilterCount = countActiveFilters(state);
  const productsForCategoryCounts = filterAndSortProducts(catalog, {
    ...state,
    category: undefined,
    sort: 'featured',
  });
  const categoryCounts = new Map<CategoryId, number>();
  for (const product of productsForCategoryCounts) {
    categoryCounts.set(product.category, (categoryCounts.get(product.category) ?? 0) + 1);
  }

  useEffect(() => {
    if (!filtersOpen) return;
    const filterTrigger = filterTriggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeFiltersRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setFiltersOpen(false);
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      filterTrigger?.focus();
    };
  }, [filtersOpen]);

  function handleSortChange(nextSort: SearchSort) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextSort === 'featured') nextParams.delete('sort');
    else nextParams.set('sort', nextSort);
    setSearchParams(nextParams);
  }

  function handlePriceApply(minimum: string, maximum: string, closeAfterApply = false) {
    let minimumValue = minimum.trim() === '' ? undefined : Math.max(0, Number(minimum));
    let maximumValue = maximum.trim() === '' ? undefined : Math.max(0, Number(maximum));
    if (!Number.isFinite(minimumValue)) minimumValue = undefined;
    if (!Number.isFinite(maximumValue)) maximumValue = undefined;
    if (
      minimumValue !== undefined &&
      maximumValue !== undefined &&
      minimumValue > maximumValue
    ) {
      [minimumValue, maximumValue] = [maximumValue, minimumValue];
    }

    const nextParams = new URLSearchParams(searchParams);
    if (minimumValue === undefined) nextParams.delete('minPrice');
    else nextParams.set('minPrice', String(minimumValue));
    if (maximumValue === undefined) nextParams.delete('maxPrice');
    else nextParams.set('maxPrice', String(maximumValue));
    setSearchParams(nextParams);
    if (closeAfterApply) setFiltersOpen(false);
  }

  const clearFilterUpdates = {
    category: null,
    prime: null,
    rating: null,
    minPrice: null,
    maxPrice: null,
  } as const;
  const clearFiltersHref = searchHref(searchParams, clearFilterUpdates);
  const context = state.query ? `“${state.query}”` : 'all products';
  const activeCategoryName = categories.find((category) => category.id === state.category)?.name;
  const priceLabel =
    state.minimumPriceCents !== undefined || state.maximumPriceCents !== undefined
      ? state.minimumPriceCents === undefined
        ? `Up to ${formatCurrency(state.maximumPriceCents!)}`
        : state.maximumPriceCents === undefined
          ? `${formatCurrency(state.minimumPriceCents)} & above`
          : `${formatCurrency(state.minimumPriceCents)}–${formatCurrency(state.maximumPriceCents)}`
      : undefined;

  return (
    <main className={styles.searchPage} id="main-content">
      <h1 className={styles.visuallyHidden}>Search results</h1>

      <div className={styles.resultsBar}>
        <p>
          {results.length > 0 ? `1–${results.length} of ${results.length}` : '0'} results for{' '}
          <strong>{context}</strong>
        </p>
        <label className={styles.sortControl}>
          <span>Sort by:</span>
          <select
            aria-label="Sort results"
            value={state.sort}
            onChange={(event) => handleSortChange(event.target.value as SearchSort)}
          >
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Avg. Customer Review</option>
            <option value="featured">Featured</option>
          </select>
        </label>
      </div>

      <div className={styles.mobileControlBar}>
        <button
          ref={filterTriggerRef}
          type="button"
          aria-controls="mobile-filter-drawer"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(true)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 4h16M5 10h10M8 16h4" /></svg>
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
        <span>{results.length} {results.length === 1 ? 'result' : 'results'}</span>
      </div>

      {activeFilterCount > 0 ? (
        <nav className={styles.activeFilters} aria-label="Active filters">
          {activeCategoryName ? (
            <Link to={searchHref(searchParams, { category: null })}>{activeCategoryName} <span aria-hidden="true">×</span></Link>
          ) : null}
          {state.primeOnly ? (
            <Link to={searchHref(searchParams, { prime: null })}>Prime <span aria-hidden="true">×</span></Link>
          ) : null}
          {state.minimumRating !== undefined ? (
            <Link to={searchHref(searchParams, { rating: null })}>{state.minimumRating}+ stars <span aria-hidden="true">×</span></Link>
          ) : null}
          {priceLabel ? (
            <Link to={searchHref(searchParams, { minPrice: null, maxPrice: null })}>{priceLabel} <span aria-hidden="true">×</span></Link>
          ) : null}
          <Link className={styles.clearFilters} to={clearFiltersHref}>Clear all</Link>
        </nav>
      ) : null}

      <div className={styles.pageBody}>
        <aside className={styles.sidebar} aria-label="Search filters">
          <h2>Filters</h2>
          <FilterPanel
            categoryCounts={categoryCounts}
            idPrefix="desktop-filter"
            onPriceApply={handlePriceApply}
            searchParams={searchParams}
            state={state}
          />
        </aside>

        <section className={styles.results} aria-label={`Results for ${state.query || 'all products'}`}>
          {results.length > 0 ? (
            <>
              <div className={styles.resultsHeading}>
                <h2>Results</h2>
                <p>Check each product page for other buying options.</p>
              </div>
              {results.map((product, index) => (
                <SearchResult product={product} index={index} key={product.id} />
              ))}
            </>
          ) : (
            <NoResults
              clearHref={activeFilterCount > 0 ? clearFiltersHref : undefined}
              query={state.query || 'your search'}
            />
          )}
        </section>
      </div>

      {filtersOpen ? (
        <div className={styles.drawerLayer}>
          <button
            className={styles.drawerBackdrop}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setFiltersOpen(false)}
          />
          <section
            id="mobile-filter-drawer"
            className={styles.filterDrawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filter-title"
          >
            <header>
              <div>
                <h2 id="mobile-filter-title">Filters</h2>
                <p>{activeFilterCount} selected</p>
              </div>
              <button
                ref={closeFiltersRef}
                type="button"
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 4 12 12M16 4 4 16" /></svg>
              </button>
            </header>
            <div className={styles.drawerContent}>
              <FilterPanel
                categoryCounts={categoryCounts}
                idPrefix="mobile-filter"
                onNavigate={() => setFiltersOpen(false)}
                onPriceApply={(minimum, maximum) => handlePriceApply(minimum, maximum, true)}
                searchParams={searchParams}
                state={state}
              />
            </div>
            <footer>
              {activeFilterCount > 0 ? <Link to={clearFiltersHref} onClick={() => setFiltersOpen(false)}>Clear all</Link> : <span />}
              <button type="button" onClick={() => setFiltersOpen(false)}>Show {results.length} results</button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
