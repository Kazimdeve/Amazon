import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatCurrency } from '../../../lib/currency';
import { recoverImage } from '../../../lib/imageFallback';
import { loadCompletedOrder, type CompletedOrder } from '../orderStorage';
import styles from './OrderSuccessPage.module.css';

function CheckIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" /><path d="m14 24 7 7 14-15" /></svg>;
}

export function OrderSuccessPage() {
  const location = useLocation();
  const stateOrder = (location.state as { order?: CompletedOrder } | null)?.order;
  const [order] = useState<CompletedOrder | null>(() => stateOrder ?? loadCompletedOrder());

  if (!order) {
    return (
      <main className={styles.page} id="main-content">
        <section className={styles.missingOrder} aria-labelledby="order-status-title">
          <h1 id="order-status-title">No recent demo order found</h1>
          <p>Your cart has not been charged. Completed demo orders appear here after checkout.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} to="/gp/cart/view.html">View cart</Link>
            <Link className={styles.secondaryButton} to="/">Back to Home</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page} id="main-content">
      <section className={styles.confirmation} aria-labelledby="order-status-title">
        <div className={styles.successHeading}>
          <CheckIcon />
          <div>
            <p>Order placed</p>
            <h1 id="order-status-title">Thank you, your demo order is confirmed!</h1>
            <span>No real Amazon order or payment was created.</span>
          </div>
        </div>
        <dl className={styles.orderMeta}>
          <div><dt>Order number</dt><dd>{order.id}</dd></div>
          <div><dt>Payment method</dt><dd>{order.paymentMethod}</dd></div>
          <div><dt>Order total</dt><dd>{formatCurrency(order.totalCents)}</dd></div>
        </dl>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.itemsPanel} aria-labelledby="order-items-title">
          <div className={styles.panelHeading}>
            <div><h2 id="order-items-title">Order details</h2><p>{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</p></div>
            <strong>{formatCurrency(order.totalCents)}</strong>
          </div>
          {order.items.map((item) => (
            <article className={styles.item} key={`${item.productId}:${item.variant ?? ''}`}>
              <img
                src={item.image}
                alt=""
                width="88"
                height="88"
                loading="lazy"
                onError={(event) => recoverImage(event.currentTarget)}
              />
              <div>
                <Link to={`/dp/${item.productId}`}>{item.title}</Link>
                {item.variant ? <span>{item.variant}</span> : null}
                <span>Quantity: {item.quantity}</span>
                <strong>{item.delivery}</strong>
              </div>
              <b>{formatCurrency(item.lineTotalCents)}</b>
            </article>
          ))}
        </section>

        <aside className={styles.summary} aria-labelledby="success-summary-title">
          <h2 id="success-summary-title">Order summary</h2>
          <dl>
            <div><dt>Items:</dt><dd>{formatCurrency(order.subtotalCents + order.savingsCents)}</dd></div>
            {order.savingsCents > 0 ? <div className={styles.savings}><dt>Savings:</dt><dd>−{formatCurrency(order.savingsCents)}</dd></div> : null}
            <div><dt>Shipping:</dt><dd>$0.00</dd></div>
          </dl>
          <div className={styles.total}><span>Order total:</span><strong>{formatCurrency(order.totalCents)}</strong></div>
          <p>Delivering to <strong>Pakistan</strong></p>
        </aside>
      </div>

      <div className={styles.actions}>
        <Link className={styles.primaryButton} to="/s">Continue Shopping</Link>
        <Link className={styles.secondaryButton} to="/">Back to Home</Link>
      </div>
    </main>
  );
}
