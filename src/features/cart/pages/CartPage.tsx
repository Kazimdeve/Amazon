import { Link } from 'react-router-dom';
import { formatCurrency } from '../../../lib/currency';
import { recoverImage } from '../../../lib/imageFallback';
import { calculateCartTotals, resolveCartItems } from '../cartSelectors';
import { useCart } from '../useCart';
import styles from './CartPage.module.css';

function CartIcon() {
  return (
    <svg viewBox="0 0 96 72" aria-hidden="true">
      <path d="M8 8h13l9 40h47l10-29H25" />
      <path d="M34 56h42" />
      <circle cx="38" cy="64" r="5" />
      <circle cx="71" cy="64" r="5" />
    </svg>
  );
}

export function CartPage() {
  const { lines, itemCount, changeQuantity, removeItem } = useCart();
  const items = resolveCartItems(lines);
  const { subtotalCents, savingsCents } = calculateCartTotals(items);

  return (
    <main className={styles.cartPage} id="main-content">
      <div className={styles.cartLayout}>
        <section className={styles.cartPanel} aria-labelledby="cart-title">
          <div className={styles.cartHeading}>
            <div>
              <h1 id="cart-title">Shopping Cart</h1>
              {items.length > 0 ? <p>Deselect all items</p> : null}
            </div>
            {items.length > 0 ? <span>Price</span> : null}
          </div>

          {items.length === 0 ? (
            <div className={styles.emptyCart}>
              <CartIcon />
              <div>
                <h2>Your Amazon Cart is empty</h2>
                <p>Shop today’s deals and discover something new.</p>
                <Link to="/s">Continue shopping</Link>
              </div>
            </div>
          ) : (
            <div className={styles.cartRows}>
              {items.map(({ line, product, variant, unitPriceCents, unitSavingsCents, savingsPercentage }) => {
                const lineKey = `${line.productId}:${line.variantId ?? ''}`;
                const maxQuantity = Math.max(10, line.quantity);
                return (
                  <article className={styles.cartRow} data-cart-row key={lineKey}>
                    <Link className={styles.imageLink} to={`/dp/${product.id}`} tabIndex={-1}>
                      <img
                        src={`/products/${product.id}.jpg`}
                        alt=""
                        onError={(event) => recoverImage(event.currentTarget)}
                      />
                    </Link>
                    <div className={styles.itemDetails}>
                      <Link className={styles.itemTitle} to={`/dp/${product.id}`}>
                        {product.title}
                      </Link>
                      <p className={product.stock.status === 'in-stock' ? styles.inStock : styles.lowStock}>
                        {product.stock.message}
                      </p>
                      {variant ? (
                        <p className={styles.variant}><strong>{variant.name}:</strong> {variant.value}</p>
                      ) : null}
                      {product.prime ? <p className={styles.prime}>✓ <strong>prime</strong></p> : null}
                      {unitSavingsCents > 0 ? (
                        <p className={styles.itemSavings}>
                          You save {formatCurrency(unitSavingsCents)} ({savingsPercentage}%)
                        </p>
                      ) : null}
                      <div className={styles.itemActions}>
                        <label>
                          <span className={styles.visuallyHidden}>Quantity for {product.title}</span>
                          <select
                            value={line.quantity}
                            aria-label={`Quantity for ${product.title}`}
                            onChange={(event) => changeQuantity({
                              productId: line.productId,
                              variantId: line.variantId,
                              quantity: Number(event.target.value),
                            })}
                          >
                            {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((quantity) => (
                              <option value={quantity} key={quantity}>{quantity}</option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeItem({
                            productId: line.productId,
                            variantId: line.variantId,
                          })}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className={styles.itemPrice}>
                      <strong>{formatCurrency(unitPriceCents)}</strong>
                      {unitSavingsCents > 0 ? <span>{formatCurrency(product.listPriceCents)}</span> : null}
                    </div>
                  </article>
                );
              })}
              <p className={styles.panelSubtotal}>
                Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'}):{' '}
                <strong>{formatCurrency(subtotalCents)}</strong>
              </p>
            </div>
          )}
        </section>

        {items.length > 0 ? (
          <aside className={styles.subtotalCard} aria-label="Cart subtotal">
            {savingsCents > 0 ? (
              <p className={styles.savings}>Your savings: {formatCurrency(savingsCents)}</p>
            ) : null}
            <p className={styles.subtotal}>
              Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'}):{' '}
              <strong>{formatCurrency(subtotalCents)}</strong>
            </p>
            <label className={styles.giftOrder}>
              <input type="checkbox" /> This order contains a gift
            </label>
            <Link className={styles.checkoutButton} to="/checkout/payment">Proceed to checkout</Link>
            <p className={styles.checkoutNote}>Secure demo checkout. No real payment is processed.</p>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
