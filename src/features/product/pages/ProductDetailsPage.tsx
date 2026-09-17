import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { categories } from '../../../data/categories';
import { formatCurrency } from '../../../lib/currency';
import { recoverImage } from '../../../lib/imageFallback';
import { calculateSavings } from '../../../lib/pricing';
import { useCart } from '../../cart/useCart';
import { findProductById } from '../../catalog/catalogSelectors';
import type { Product, ProductBadge, ProductVariant } from '../../catalog/types';
import styles from './ProductDetailsPage.module.css';

const badgeLabels: Record<ProductBadge, string> = {
  'amazon-choice': "Amazon's Choice",
  'best-seller': '#1 Best Seller',
  'climate-pledge-friendly': 'Climate Pledge Friendly',
  'limited-time-deal': 'Limited time deal',
  'small-business': 'Small Business',
};

function getDefaultVariant(product: Product) {
  return product.variants.find((variant) => variant.inStock && variant.priceCents === undefined)
    ?? product.variants.find((variant) => variant.inStock)
    ?? product.variants[0];
}

function Price({ cents }: { cents: number }) {
  const whole = Math.floor(cents / 100).toLocaleString('en-US');
  const fraction = String(cents % 100).padStart(2, '0');
  return (
    <span className={styles.price} aria-label={formatCurrency(cents)}>
      <sup>$</sup><span>{whole}</span><sup>{fraction}</sup>
    </span>
  );
}

function StarRating({ product }: { product: Product }) {
  return (
    <div className={styles.ratingRow}>
      <a href="#customer-reviews">{product.rating.toFixed(1)}</a>
      <span className={styles.stars} aria-label={`${product.rating} out of 5 stars`}>
        <span className={styles.emptyStars} aria-hidden="true">★★★★★</span>
        <span
          className={styles.filledStars}
          style={{ inlineSize: `${(product.rating / 5) * 100}%` }}
          aria-hidden="true"
        >
          ★★★★★
        </span>
      </span>
      <a href="#customer-reviews">{product.reviewCount.toLocaleString()} ratings</a>
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

function LocationIcon() {
  return (
    <svg viewBox="0 0 18 20" aria-hidden="true">
      <path d="M9 19s6-6.4 6-11A6 6 0 1 0 3 8c0 4.6 6 11 6 11Z" />
      <circle cx="9" cy="8" r="2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 18 20" aria-hidden="true">
      <rect x="3" y="8" width="12" height="10" rx="1" />
      <path d="M6 8V5a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="8" />
      <path d="m5 9 2.5 2.5L13 6" />
    </svg>
  );
}

function ProductBreadcrumbs({ product }: { product: Product }) {
  const category = categories.find((item) => item.id === product.category);
  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <Link to="/">Home</Link><span aria-hidden="true">›</span>
      {category ? (
        <>
          <Link to={`/s?${new URLSearchParams({ k: category.name, category: category.id })}`}>
            {category.name}
          </Link>
          <span aria-hidden="true">›</span>
        </>
      ) : null}
      <Link to={`/s?${new URLSearchParams({ k: product.brand })}`}>{product.brand}</Link>
    </nav>
  );
}

interface ProductGalleryProps {
  readonly product: Product;
  readonly selectedVariant: ProductVariant;
}

function ProductGallery({ product, selectedVariant }: ProductGalleryProps) {
  const primaryImage = `/products/${product.id}.jpg`;
  const images = useMemo(
    () => Array.from(new Set([
      primaryImage,
      ...product.images,
      ...product.variants.flatMap((variant) => variant.image ? [variant.image] : []),
    ])),
    [primaryImage, product.images, product.variants],
  );
  const [activeImage, setActiveImage] = useState(primaryImage);
  const activeImageIndex = Math.max(0, images.indexOf(activeImage));

  useEffect(() => {
    setActiveImage(selectedVariant.image ?? primaryImage);
  }, [primaryImage, selectedVariant.id, selectedVariant.image]);

  function selectThumbnail(index: number) {
    setActiveImage(images[index]);
  }

  function handleThumbnailKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | undefined;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (index + 1) % images.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + images.length) % images.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = images.length - 1;
    }

    if (nextIndex === undefined) return;
    event.preventDefault();
    selectThumbnail(nextIndex);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button');
    buttons?.[nextIndex]?.focus();
  }

  return (
    <section className={styles.gallery} aria-label="Product gallery" data-product-gallery>
      <div className={styles.thumbnails} role="group" aria-label="Product images">
        {images.map((image, index) => (
          <button
            className={activeImage === image ? styles.activeThumbnail : ''}
            type="button"
            aria-label={`View product image ${index + 1} of ${images.length}`}
            aria-pressed={activeImage === image}
            tabIndex={activeImage === image ? 0 : -1}
            onClick={() => selectThumbnail(index)}
            onMouseEnter={() => selectThumbnail(index)}
            onKeyDown={(event) => handleThumbnailKeyDown(event, index)}
            key={image}
          >
            <img
              src={image}
              alt=""
              onError={(event) => recoverImage(event.currentTarget, primaryImage)}
            />
          </button>
        ))}
      </div>
      <div className={styles.mainImage}>
        <img
          src={activeImage}
          alt={`${product.title}, image ${activeImageIndex + 1} of ${images.length}`}
          fetchPriority="high"
          onError={(event) => {
            if (activeImage !== primaryImage) {
              setActiveImage(primaryImage);
              return;
            }
            recoverImage(event.currentTarget);
          }}
        />
        <p>Roll over thumbnails to view more images</p>
      </div>
    </section>
  );
}

interface VariantSelectorProps {
  readonly product: Product;
  readonly selectedVariant: ProductVariant;
  readonly onChange: (variant: ProductVariant) => void;
}

function VariantSelector({ product, selectedVariant, onChange }: VariantSelectorProps) {
  if (product.variants.length === 0) return null;
  const variantName = product.variants[0].name;

  function handleVariantKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }

    const availableVariants = product.variants
      .map((variant, variantIndex) => ({ variant, variantIndex }))
      .filter(({ variant }) => variant.inStock);
    const availableIndex = availableVariants.findIndex(({ variantIndex }) => variantIndex === index);
    let nextAvailableIndex = availableIndex;

    if (event.key === 'Home') nextAvailableIndex = 0;
    else if (event.key === 'End') nextAvailableIndex = availableVariants.length - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextAvailableIndex = (availableIndex + 1) % availableVariants.length;
    } else {
      nextAvailableIndex = (availableIndex - 1 + availableVariants.length) % availableVariants.length;
    }

    const next = availableVariants[nextAvailableIndex];
    if (!next) return;
    event.preventDefault();
    onChange(next.variant);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button');
    buttons?.[next.variantIndex]?.focus();
  }

  return (
    <section className={styles.variants} aria-labelledby="variant-title">
      <p id="variant-title"><strong>{variantName}:</strong> {selectedVariant.value}</p>
      <div role="radiogroup" aria-labelledby="variant-title">
        {product.variants.map((variant, index) => (
          <button
            className={variant.id === selectedVariant.id ? styles.selectedVariant : ''}
            type="button"
            role="radio"
            aria-checked={variant.id === selectedVariant.id}
            aria-label={`${variant.value}${variant.priceCents !== undefined ? `, ${formatCurrency(variant.priceCents)}` : ''}${!variant.inStock ? ', unavailable' : ''}`}
            tabIndex={variant.id === selectedVariant.id ? 0 : -1}
            disabled={!variant.inStock}
            onClick={() => onChange(variant)}
            onKeyDown={(event) => handleVariantKeyDown(event, index)}
            key={variant.id}
          >
            <span>{variant.value}</span>
            {variant.priceCents !== undefined ? <small>{formatCurrency(variant.priceCents)}</small> : null}
            {!variant.inStock ? <small>Unavailable</small> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

interface ProductSummaryProps {
  readonly product: Product;
  readonly selectedVariant: ProductVariant;
  readonly onVariantChange: (variant: ProductVariant) => void;
}

function ProductSummary({ product, selectedVariant, onVariantChange }: ProductSummaryProps) {
  const activePrice = selectedVariant.priceCents ?? product.priceCents;
  const savings = calculateSavings(activePrice, product.listPriceCents);

  return (
    <section className={styles.summary} aria-label="Product information" data-product-summary>
      <p className={styles.brandLink}>Visit the <Link to={`/s?${new URLSearchParams({ k: product.brand })}`}>{product.brand} Store</Link></p>
      <h2>{product.title}</h2>
      <StarRating product={product} />
      {product.boughtPastMonth > 0 ? (
        <p className={styles.salesSignal}>{product.boughtPastMonth.toLocaleString()}+ bought in past month</p>
      ) : null}

      <div className={styles.rule} />
      <div className={styles.badges} aria-label="Product badges">
        {product.badges.map((badge) => <span key={badge}>{badgeLabels[badge]}</span>)}
      </div>
      <div className={styles.priceBlock}>
        {savings ? <span className={styles.discount}>-{savings.percentage}%</span> : null}
        <Price cents={activePrice} />
      </div>
      {savings ? <p className={styles.listPrice}>List Price: <span>{formatCurrency(product.listPriceCents)}</span></p> : null}
      <p className={styles.fees}>No Import Fees Deposit &amp; {formatCurrency(0)} Shipping to Pakistan</p>
      {product.prime ? <PrimeMark /> : null}

      <VariantSelector
        product={product}
        selectedVariant={selectedVariant}
        onChange={onVariantChange}
      />

      <div className={styles.rule} />
      <section className={styles.productInformation} aria-labelledby="product-information-title">
        <h3 id="product-information-title">Product information</h3>
        <dl>
          {Object.entries(product.specifications).slice(0, 5).map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </section>

      <div className={styles.rule} />
      <section className={styles.about} aria-labelledby="about-item-title">
        <h3 id="about-item-title">About this item</h3>
        <ul>{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
      </section>
    </section>
  );
}

function BuyBox({ product, selectedVariant }: { product: Product; selectedVariant: ProductVariant }) {
  const { addItem, itemCount } = useCart();
  const navigate = useNavigate();
  const activePrice = selectedVariant.priceCents ?? product.priceCents;
  const maxQuantity = Math.min(5, product.stock.quantity ?? 5);
  const canPurchase = product.stock.status !== 'out-of-stock' && selectedVariant.inStock;
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => setMessage(''), [product.id, selectedVariant.id]);

  function handleAddToCart() {
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      quantity,
    });
    const nextCount = itemCount + quantity;
    setMessage(
      `Added to Cart — ${quantity} ${quantity === 1 ? 'item' : 'items'} added. ${nextCount} ${nextCount === 1 ? 'item' : 'items'} in cart.`,
    );
  }

  function handleBuyNow() {
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      quantity,
    });
    navigate('/checkout/payment');
  }

  return (
    <aside className={styles.buyBox} aria-label="Purchase options" data-buy-box>
      <Price cents={activePrice} />
      {product.prime ? <PrimeMark /> : null}
      <p className={styles.deliveryText}>{product.delivery.standard}</p>
      {product.delivery.expedited ? <p className={styles.expedited}>{product.delivery.expedited}</p> : null}
      <button className={styles.deliverTo} type="button">
        <LocationIcon /> Deliver to Pakistan
      </button>
      <p className={
        product.stock.status === 'low-stock'
          ? styles.lowStock
          : product.stock.status === 'out-of-stock'
            ? styles.outOfStock
            : styles.inStock
      }>
        {product.stock.message}
      </p>

      <label className={styles.quantity}>
        <span>Quantity:</span>
        <select
          value={quantity}
          disabled={!canPurchase}
          onChange={(event) => setQuantity(Number(event.target.value))}
        >
          {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((option) => (
            <option value={option} key={option}>{option}</option>
          ))}
        </select>
      </label>
      <button
        className={styles.addToCart}
        type="button"
        disabled={!canPurchase}
        onClick={handleAddToCart}
      >
        Add to Cart
      </button>
      <button
        className={styles.buyNow}
        type="button"
        disabled={!canPurchase}
        onClick={handleBuyNow}
      >
        Buy Now
      </button>
      <div
        className={styles.purchaseMessage}
        role="status"
        aria-atomic="true"
        data-success={message.startsWith('Added')}
      >
        {message.startsWith('Added') ? <CheckIcon /> : null}
        <span>{message}</span>
      </div>

      <p className={styles.secure}><LockIcon /> Secure transaction</p>
      <dl className={styles.sellerInfo}>
        <div><dt>Ships from</dt><dd>Amazon.com</dd></div>
        <div><dt>Sold by</dt><dd>{product.brand}</dd></div>
        <div><dt>Returns</dt><dd>30-day refund/replacement</dd></div>
        <div><dt>Payment</dt><dd>Secure transaction</dd></div>
      </dl>
      <label className={styles.giftOption}>
        <input type="checkbox" /> <span>Add a gift receipt for easy returns</span>
      </label>
      <button className={styles.addToList} type="button">Add to List</button>
    </aside>
  );
}

function InvalidProduct({ productId }: { productId: string }) {
  return (
    <main className={styles.invalidPage} id="main-content">
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link to="/">Home</Link></nav>
      <section>
        <svg viewBox="0 0 72 72" aria-hidden="true"><path d="M12 18h48v38H12zM22 18a14 14 0 0 1 28 0M28 34h16M30 46h12" /></svg>
        <div>
          <h1>Product not found</h1>
          <p>We couldn’t find a product with ID <strong>{productId}</strong>.</p>
          <Link to="/s">Browse all products</Link>
        </div>
      </section>
    </main>
  );
}

export function ProductDetailsPage() {
  const { productId = '' } = useParams();
  const product = findProductById(productId);
  const [selectedVariantId, setSelectedVariantId] = useState('');

  useEffect(() => {
    if (product) setSelectedVariantId(getDefaultVariant(product).id);
  }, [product]);

  if (!product) return <InvalidProduct productId={productId} />;
  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId)
    ?? getDefaultVariant(product);

  return (
    <main className={styles.productPage} id="main-content">
      <h1 className={styles.visuallyHidden}>Product details</h1>
      <ProductBreadcrumbs product={product} />
      <div className={styles.productLayout} data-product-layout>
        <ProductGallery product={product} selectedVariant={selectedVariant} />
        <ProductSummary
          product={product}
          selectedVariant={selectedVariant}
          onVariantChange={(variant) => setSelectedVariantId(variant.id)}
        />
        <BuyBox product={product} selectedVariant={selectedVariant} />
      </div>
    </main>
  );
}
