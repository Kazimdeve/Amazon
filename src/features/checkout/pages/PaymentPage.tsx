import { type FormEvent, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../lib/currency';
import { recoverImage } from '../../../lib/imageFallback';
import { calculateCartTotals, resolveCartItems } from '../../cart/cartSelectors';
import { useCart } from '../../cart/useCart';
import {
  DECLINED_CARD_NUMBER,
  formatCardNumber,
  formatExpiry,
  SUCCESS_CARD_NUMBER,
  validateCardFields,
  type CardFieldErrors,
  type CardFields,
} from '../cardValidation';
import {
  createCompletedOrder,
  saveCompletedOrder,
  type DemoPaymentMethod,
} from '../orderStorage';
import styles from './PaymentPage.module.css';

const emptyCardFields: CardFields = {
  cardholderName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
};

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function PaymentPage() {
  const { lines, itemCount, clearCart } = useCart();
  const navigate = useNavigate();
  const items = useMemo(() => resolveCartItems(lines), [lines]);
  const totals = useMemo(() => calculateCartTotals(items), [items]);
  const [paymentMethod, setPaymentMethod] = useState<DemoPaymentMethod>('coa');
  const [cardFields, setCardFields] = useState<CardFields>(emptyCardFields);
  const [errors, setErrors] = useState<CardFieldErrors>({});
  const [paymentError, setPaymentError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  function updateCardField(field: keyof CardFields, value: string) {
    const formattedValue = field === 'cardNumber'
      ? formatCardNumber(value)
      : field === 'expiry'
        ? formatExpiry(value)
        : field === 'cvv'
          ? value.replace(/\D/g, '').slice(0, 3)
          : value;
    setCardFields((current) => ({ ...current, [field]: formattedValue }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setPaymentError('');
  }

  function selectPaymentMethod(method: DemoPaymentMethod) {
    setPaymentMethod(method);
    setErrors({});
    setPaymentError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processingRef.current || items.length === 0) return;

    if (paymentMethod === 'card') {
      const nextErrors = validateCardFields(cardFields);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        const form = event.currentTarget;
        window.requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
        return;
      }
    }

    processingRef.current = true;
    setPaymentError('');
    setIsProcessing(true);
    await delay(250);

    const normalizedCardNumber = cardFields.cardNumber.replace(/\s/g, '');
    if (paymentMethod === 'card' && normalizedCardNumber === DECLINED_CARD_NUMBER) {
      setPaymentError('Payment was declined by the demo card simulator. Try the successful test card or choose COA.');
      processingRef.current = false;
      setIsProcessing(false);
      return;
    }

    const order = createCompletedOrder(items, totals, paymentMethod);
    saveCompletedOrder(order);
    clearCart();
    navigate('/order/success', { replace: true, state: { order } });
  }

  if (items.length === 0) {
    return (
      <main className={styles.page} id="main-content">
        <section className={styles.emptyState} aria-labelledby="checkout-title">
          <h1 id="checkout-title">Your cart is empty</h1>
          <p>Add an item to your cart before starting checkout.</p>
          <div className={styles.emptyActions}>
            <Link className={styles.primaryButton} to="/s">Continue shopping</Link>
            <Link className={styles.secondaryButton} to="/gp/cart/view.html">View cart</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page} id="main-content">
      <nav className={styles.breadcrumb} aria-label="Checkout progress">
        <Link to="/gp/cart/view.html">Cart</Link><span aria-hidden="true">›</span><strong>Payment</strong>
      </nav>
      <h1 id="checkout-title">Checkout</h1>
      <form className={styles.checkoutGrid} onSubmit={handleSubmit} noValidate>
        <div className={styles.mainColumn}>
          <section className={styles.panel} aria-labelledby="payment-heading">
            <div className={styles.sectionHeading}>
              <span>1</span>
              <div>
                <h2 id="payment-heading">Payment method</h2>
                <p>Choose how you want to complete this demo order.</p>
              </div>
            </div>

            <div className={styles.demoNotice} role="note">
              <strong>Demo checkout only</strong>
              <span>No real payment is processed. Do not enter real card information.</span>
            </div>

            <div className={styles.paymentOptions}>
              <label className={`${styles.paymentOption} ${paymentMethod === 'coa' ? styles.selectedOption : ''}`}>
                <input
                  type="radio"
                  name="payment-method"
                  value="coa"
                  checked={paymentMethod === 'coa'}
                  onChange={() => selectPaymentMethod('coa')}
                />
                <span>
                  <strong>Cash on Arrival (COA)</strong>
                  <small>Pay when your demo order arrives.</small>
                </span>
              </label>

              <label className={`${styles.paymentOption} ${paymentMethod === 'card' ? styles.selectedOption : ''}`}>
                <input
                  type="radio"
                  name="payment-method"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => selectPaymentMethod('card')}
                />
                <span>
                  <strong>Card</strong>
                  <small>Use one of the local test cards below.</small>
                </span>
              </label>
            </div>

            {paymentMethod === 'card' ? (
              <div className={styles.cardArea}>
                <div className={styles.testCards} aria-labelledby="test-cards-title">
                  <div>
                    <strong id="test-cards-title">TEST CARDS</strong>
                    <span>Local simulation — no payment provider</span>
                  </div>
                  <dl>
                    <div><dt>Successful payment</dt><dd>{formatCardNumber(SUCCESS_CARD_NUMBER)}</dd></div>
                    <div><dt>Declined payment</dt><dd>{formatCardNumber(DECLINED_CARD_NUMBER)}</dd></div>
                  </dl>
                  <p>Use any future expiry date and any 3-digit CVV.</p>
                </div>

                {paymentError ? <div className={styles.paymentError} role="alert"><strong>Payment unsuccessful</strong><span>{paymentError}</span></div> : null}

                <div className={styles.cardForm}>
                  <div className={styles.fullField}>
                    <label htmlFor="cardholder-name">Cardholder name</label>
                    <input
                      id="cardholder-name"
                      value={cardFields.cardholderName}
                      onChange={(event) => updateCardField('cardholderName', event.target.value)}
                      autoComplete="off"
                      required
                      aria-invalid={Boolean(errors.cardholderName)}
                      aria-describedby={errors.cardholderName ? 'cardholder-name-error' : undefined}
                    />
                    {errors.cardholderName ? <span className={styles.fieldError} id="cardholder-name-error">{errors.cardholderName}</span> : null}
                  </div>
                  <div className={styles.fullField}>
                    <label htmlFor="card-number">Card number</label>
                    <input
                      id="card-number"
                      value={cardFields.cardNumber}
                      onChange={(event) => updateCardField('cardNumber', event.target.value)}
                      inputMode="numeric"
                      autoComplete="off"
                      required
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      aria-invalid={Boolean(errors.cardNumber)}
                      aria-describedby={errors.cardNumber ? 'card-number-error' : undefined}
                    />
                    {errors.cardNumber ? <span className={styles.fieldError} id="card-number-error">{errors.cardNumber}</span> : null}
                  </div>
                  <div>
                    <label htmlFor="card-expiry">Expiry</label>
                    <input
                      id="card-expiry"
                      value={cardFields.expiry}
                      onChange={(event) => updateCardField('expiry', event.target.value)}
                      inputMode="numeric"
                      autoComplete="off"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      aria-invalid={Boolean(errors.expiry)}
                      aria-describedby={errors.expiry ? 'card-expiry-error' : undefined}
                    />
                    {errors.expiry ? <span className={styles.fieldError} id="card-expiry-error">{errors.expiry}</span> : null}
                  </div>
                  <div>
                    <label htmlFor="card-cvv">CVV</label>
                    <input
                      id="card-cvv"
                      type="password"
                      value={cardFields.cvv}
                      onChange={(event) => updateCardField('cvv', event.target.value)}
                      inputMode="numeric"
                      autoComplete="off"
                      required
                      placeholder="123"
                      maxLength={3}
                      aria-invalid={Boolean(errors.cvv)}
                      aria-describedby={errors.cvv ? 'card-cvv-error' : undefined}
                    />
                    {errors.cvv ? <span className={styles.fieldError} id="card-cvv-error">{errors.cvv}</span> : null}
                  </div>
                </div>
              </div>
            ) : (
              <p className={styles.coaMessage}><strong>COA selected.</strong> No additional payment details are needed for this demo.</p>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="items-heading">
            <div className={styles.sectionHeading}>
              <span>2</span>
              <div><h2 id="items-heading">Review items and delivery</h2><p>Delivering to Pakistan</p></div>
            </div>
            <div className={styles.itemsList}>
              {items.map(({ line, product, variant, unitPriceCents }) => (
                <article className={styles.item} key={`${line.productId}:${line.variantId ?? ''}`}>
                  <img
                    src={`/products/${product.id}.jpg`}
                    alt=""
                    width="92"
                    height="92"
                    loading="lazy"
                    onError={(event) => recoverImage(event.currentTarget)}
                  />
                  <div className={styles.itemDetails}>
                    <Link to={`/dp/${product.id}`}>{product.title}</Link>
                    {variant ? <span>{variant.name}: {variant.value}</span> : null}
                    <span>Quantity: {line.quantity}</span>
                    <strong className={styles.delivery}>{product.delivery.standard}</strong>
                  </div>
                  <strong className={styles.itemPrice}>{formatCurrency(unitPriceCents * line.quantity)}</strong>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.orderSummary} aria-labelledby="summary-heading">
          <button className={styles.placeOrderButton} type="submit" disabled={isProcessing}>
            {isProcessing ? 'Processing order…' : 'Place your order'}
          </button>
          <p className={styles.submitNote}>By placing your order, you agree this is a local demo transaction.</p>
          <hr />
          <h2 id="summary-heading">Order Summary</h2>
          <dl>
            <div><dt>Items ({itemCount}):</dt><dd>{formatCurrency(totals.listTotalCents)}</dd></div>
            {totals.savingsCents > 0 ? <div className={styles.savings}><dt>Savings:</dt><dd>−{formatCurrency(totals.savingsCents)}</dd></div> : null}
            <div><dt>Shipping:</dt><dd>$0.00</dd></div>
          </dl>
          <div className={styles.orderTotal}><span>Order total:</span><strong>{formatCurrency(totals.totalCents)}</strong></div>
          {isProcessing ? <p className={styles.processingStatus} role="status">Securely simulating your order. Please wait.</p> : null}
        </aside>
      </form>
    </main>
  );
}
