import { Link } from 'react-router-dom';
import { type ProductId } from '../../../data/catalog';
import { categories } from '../../../data/categories';
import { homepageConfig } from '../../../data/homepage';
import { formatCurrency } from '../../../lib/currency';
import { recoverImage } from '../../../lib/imageFallback';
import { calculateSavings } from '../../../lib/pricing';
import { findProductById } from '../../catalog/catalogSelectors';
import type { Category, Product } from '../../catalog/types';
import styles from './HomePage.module.css';

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const badgeLabels = {
  'amazon-choice': 'Popular pick',
  'best-seller': 'Best seller',
  'climate-pledge-friendly': 'Lower-impact choice',
  'limited-time-deal': 'Limited-time deal',
  'small-business': 'Small business',
} as const;

function getProducts(productIds: readonly ProductId[]): Product[] {
  return productIds.map((productId) => {
    const product = findProductById(productId);
    if (!product) throw new Error(`Unknown homepage product: ${productId}`);
    return product;
  });
}

function getCategory(categoryId: Category['id']): Category {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) throw new Error(`Unknown homepage category: ${categoryId}`);
  return category;
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 5l5 5-5 5" />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M3 7h14v13H3zM17 11h4l4 5v4h-8z" />
      <circle cx="8" cy="21" r="2.5" />
      <circle cx="21" cy="21" r="2.5" />
    </svg>
  );
}

function DiscoveryIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <path d="m17 17 7 7M12 8v8M8 12h8" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M8 9H4l4-4M4 9c2-4 5-6 10-6a11 11 0 1 1-10 14" />
      <path d="M10 11h8v8h-8z" />
    </svg>
  );
}

function ProductCard({ product, showSavings = false }: { product: Product; showSavings?: boolean }) {
  const savings = calculateSavings(product.priceCents, product.listPriceCents);
  const badge = product.badges[0];

  return (
    <article className={styles.productCard} data-product-card>
      <Link className={styles.productImageLink} to={`/dp/${product.id}`}>
        {badge ? <span className={styles.productBadge}>{badgeLabels[badge]}</span> : null}
        <img
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          onError={(event) => recoverImage(event.currentTarget, `/products/${product.id}.jpg`)}
        />
      </Link>
      <div className={styles.productDetails}>
        <p className={styles.productBrand}>{product.brand}</p>
        <h3>
          <Link to={`/dp/${product.id}`}>{product.title}</Link>
        </h3>
        <div className={styles.ratingRow}>
          <span className={styles.rating} aria-label={`${product.rating} out of 5 stars`}>
            <span aria-hidden="true">★</span> {product.rating}
          </span>
          <span>{compactNumber.format(product.reviewCount)} reviews</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatCurrency(product.priceCents)}</span>
          <span className={styles.listPrice}>{formatCurrency(product.listPriceCents)}</span>
          {showSavings && savings ? (
            <span className={styles.savings}>Save {savings.percentage}%</span>
          ) : null}
        </div>
        <div className={styles.deliveryRow}>
          {product.prime ? <span className={styles.prime}>prime</span> : null}
          <span>{product.delivery.standard.replace('FREE ', '')}</span>
        </div>
      </div>
    </article>
  );
}

interface ProductRailProps {
  description: string;
  id: string;
  products: readonly Product[];
  showSavings?: boolean;
  title: string;
  tone?: 'default' | 'warm';
}

function ProductRail({
  description,
  id,
  products,
  showSavings = false,
  title,
  tone = 'default',
}: ProductRailProps) {
  return (
    <section
      className={`${styles.discoverySection} ${tone === 'warm' ? styles.warmSection : ''}`}
      data-home-section
      aria-labelledby={`${id}-title`}
    >
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionEyebrow}>{tone === 'warm' ? 'Worth a closer look' : 'Picked for you'}</p>
          <h2 id={`${id}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
        <Link className={styles.sectionLink} to={`/s?${new URLSearchParams({ k: title }).toString()}`}>
          View collection <ArrowIcon />
        </Link>
      </div>
      <div className={styles.productRail} data-product-rail>
        {products.map((product) => (
          <ProductCard product={product} showSavings={showSavings} key={product.id} />
        ))}
      </div>
    </section>
  );
}

function HomePromiseBar() {
  return (
    <section className={styles.promiseBar} aria-label="Shopping benefits" data-home-section>
      <div>
        <span className={styles.promiseIcon}><DeliveryIcon /></span>
        <span><strong>Delivery that fits your day</strong><small>Clear estimates before you choose</small></span>
      </div>
      <div>
        <span className={styles.promiseIcon}><DiscoveryIcon /></span>
        <span><strong>Less searching, better finds</strong><small>Useful details and focused collections</small></span>
      </div>
      <div>
        <span className={styles.promiseIcon}><ReturnIcon /></span>
        <span><strong>Shop with confidence</strong><small>Ratings, availability, and easy returns</small></span>
      </div>
    </section>
  );
}

function RefreshShowcase({ products }: { products: readonly Product[] }) {
  const [leadProduct, ...supportingProducts] = products;

  return (
    <section className={styles.showcase} data-home-section aria-labelledby="refresh-space-title">
      <Link className={styles.showcaseImage} to={`/dp/${leadProduct.id}`}>
        <img
          src={leadProduct.images[0]}
          alt={leadProduct.title}
          loading="lazy"
          onError={(event) => recoverImage(event.currentTarget, `/products/${leadProduct.id}.jpg`)}
        />
        <span>Editor’s pick</span>
      </Link>
      <div className={styles.showcaseContent}>
        <p className={styles.sectionEyebrow}>One room, considered</p>
        <h2 id="refresh-space-title">Refresh your space</h2>
        <p className={styles.showcaseIntro}>
          A calmer, more capable home starts with a few thoughtful upgrades. Explore practical
          pieces selected for comfort, focus, and everyday ease.
        </p>
        <Link className={styles.showcaseCta} to="/s?k=Refresh+your+space">
          Explore the collection <ArrowIcon />
        </Link>
        <div className={styles.showcaseProducts}>
          {supportingProducts.map((product) => (
            <Link to={`/dp/${product.id}`} key={product.id}>
              <img
                src={product.images[0]}
                alt=""
                loading="lazy"
                onError={(event) => recoverImage(event.currentTarget, `/products/${product.id}.jpg`)}
              />
              <span><strong>{product.brand}</strong><small>{formatCurrency(product.priceCents)}</small></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function InterestCard({ category, kicker }: { category: Category; kicker: string }) {
  return (
    <Link
      className={styles.interestCard}
      to={`/s?${new URLSearchParams({ category: category.id, k: category.name }).toString()}`}
    >
      <img
        src={category.image}
        alt=""
        loading="lazy"
        onError={(event) => recoverImage(event.currentTarget)}
      />
      <span className={styles.interestShade} aria-hidden="true" />
      <span className={styles.interestCopy}>
        <small>{kicker}</small>
        <strong>{category.name}</strong>
        <span>Explore collection <ArrowIcon /></span>
      </span>
    </Link>
  );
}

export function HomePage() {
  const featuredCategories = homepageConfig.sections[0].categoryIds.map(getCategory);
  const topPicks = getProducts(homepageConfig.sections[1].productIds);
  const deals = getProducts(homepageConfig.sections[2].productIds);
  const refreshProducts = getProducts(homepageConfig.sections[3].productIds);
  const heroImage = homepageConfig.hero.image;

  return (
    <main className={styles.homePage} id="main-content">
      <h1 className={styles.visuallyHidden}>Home</h1>
      <section className={styles.hero} aria-labelledby="homepage-hero-title">
        <img
          className={styles.heroImage}
          src={heroImage}
          srcSet={`${heroImage.replace('w=1800', 'w=640')} 640w, ${heroImage.replace('w=1800', 'w=1024')} 1024w, ${heroImage.replace('w=1800', 'w=1500')} 1500w, ${heroImage} 1800w`}
          sizes="(min-width: 1500px) 1500px, 100vw"
          alt="Everyday essentials arranged for home, work, and life on the go"
          loading="eager"
          fetchPriority="high"
          onError={(event) => recoverImage(event.currentTarget)}
        />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Fresh finds for real life</p>
          <h2 id="homepage-hero-title">{homepageConfig.hero.title}</h2>
          <p>{homepageConfig.hero.subtitle}</p>
          <Link to={`/dp/${homepageConfig.hero.productId}`}>Explore everyday favorites <ArrowIcon /></Link>
        </div>
      </section>

      <section className={styles.merchandising} aria-label="Featured shopping categories">
        {featuredCategories.map((category) => (
          <article className={styles.merchCard} data-merch-card key={category.id}>
            <div className={styles.merchHeading}><span>Shop department</span><h2>{category.name}</h2></div>
            <Link
              className={styles.categoryImageLink}
              to={`/s?${new URLSearchParams({ category: category.id, k: category.name }).toString()}`}
              aria-label={`Shop ${category.name}`}
            >
              <img
                src={category.image}
                alt=""
                loading="lazy"
                onError={(event) => recoverImage(event.currentTarget)}
              />
            </Link>
            <Link className={styles.shopLink} to={`/s?${new URLSearchParams({ category: category.id, k: category.name }).toString()}`}>
              Explore {category.name} <ArrowIcon />
            </Link>
          </article>
        ))}
      </section>

      <div className={styles.contentStack}>
        <HomePromiseBar />
        <ProductRail
          id="top-picks"
          title="Top picks for you"
          description="Customer-loved essentials with strong ratings and practical details."
          products={topPicks}
        />
        <RefreshShowcase products={refreshProducts} />
        <ProductRail
          id="deals"
          title="Deals worth a look"
          description="Timely savings on useful upgrades—without the endless bargain-bin scroll."
          products={deals}
          showSavings
          tone="warm"
        />
        <section className={styles.interestsSection} data-home-section aria-labelledby="interests-title">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Browse by mood</p>
              <h2 id="interests-title">More ways to discover</h2>
              <p>Start with what you want to improve, then explore a focused collection.</p>
            </div>
          </div>
          <div className={styles.interestGrid}>
            <InterestCard category={getCategory('office')} kicker="Create a calmer setup" />
            <InterestCard category={getCategory('sports-outdoors')} kicker="Make room to move" />
          </div>
        </section>
      </div>
    </main>
  );
}
