import type { CartTotals, ResolvedCartItem } from '../cart/cartSelectors';

export const COMPLETED_ORDER_STORAGE_KEY = 'amazon-clone-completed-order';

export type DemoPaymentMethod = 'coa' | 'card';

export interface CompletedOrderItem {
  readonly productId: string;
  readonly title: string;
  readonly image: string;
  readonly quantity: number;
  readonly variant?: string;
  readonly unitPriceCents: number;
  readonly lineTotalCents: number;
  readonly delivery: string;
}

export interface CompletedOrder {
  readonly id: string;
  readonly placedAt: string;
  readonly paymentMethod: string;
  readonly items: readonly CompletedOrderItem[];
  readonly itemCount: number;
  readonly subtotalCents: number;
  readonly savingsCents: number;
  readonly totalCents: number;
}

function createOrderId() {
  const randomPart = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replaceAll('-', '').slice(0, 8)
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.slice(-8);
  return `ORDER-${randomPart.toUpperCase().padStart(8, '0')}`;
}

export function createCompletedOrder(
  items: readonly ResolvedCartItem[],
  totals: CartTotals,
  paymentMethod: DemoPaymentMethod,
): CompletedOrder {
  return {
    id: createOrderId(),
    placedAt: new Date().toISOString(),
    paymentMethod: paymentMethod === 'coa' ? 'Cash on Arrival (COA)' : 'Demo card ending in 4242',
    items: items.map(({ line, product, variant, unitPriceCents }) => ({
      productId: product.id,
      title: product.title,
      image: `/products/${product.id}.jpg`,
      quantity: line.quantity,
      ...(variant ? { variant: `${variant.name}: ${variant.value}` } : {}),
      unitPriceCents,
      lineTotalCents: unitPriceCents * line.quantity,
      delivery: product.delivery.standard,
    })),
    itemCount: items.reduce((total, item) => total + item.line.quantity, 0),
    subtotalCents: totals.subtotalCents,
    savingsCents: totals.savingsCents,
    totalCents: totals.totalCents,
  };
}

export function saveCompletedOrder(order: CompletedOrder) {
  try {
    window.sessionStorage.setItem(COMPLETED_ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch {
    // The navigation state still lets the success page render if storage is unavailable.
  }
}

function isCompletedOrder(value: unknown): value is CompletedOrder {
  if (!value || typeof value !== 'object') return false;
  const order = value as Partial<CompletedOrder>;
  return typeof order.id === 'string'
    && /^ORDER-[A-Z0-9]{8}$/.test(order.id)
    && typeof order.placedAt === 'string'
    && typeof order.paymentMethod === 'string'
    && Array.isArray(order.items)
    && order.items.length > 0
    && order.items.every((item) => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<CompletedOrderItem>;
      return typeof candidate.productId === 'string'
        && candidate.productId.length > 0
        && typeof candidate.title === 'string'
        && typeof candidate.image === 'string'
        && Number.isInteger(candidate.quantity)
        && (candidate.quantity ?? 0) > 0
        && (candidate.variant === undefined || typeof candidate.variant === 'string')
        && Number.isInteger(candidate.unitPriceCents)
        && (candidate.unitPriceCents ?? -1) >= 0
        && Number.isInteger(candidate.lineTotalCents)
        && (candidate.lineTotalCents ?? -1) >= 0
        && typeof candidate.delivery === 'string';
    })
    && typeof order.itemCount === 'number'
    && Number.isInteger(order.itemCount)
    && order.itemCount > 0
    && typeof order.subtotalCents === 'number'
    && Number.isInteger(order.subtotalCents)
    && order.subtotalCents >= 0
    && typeof order.savingsCents === 'number'
    && Number.isInteger(order.savingsCents)
    && order.savingsCents >= 0
    && typeof order.totalCents === 'number'
    && Number.isInteger(order.totalCents)
    && order.totalCents >= 0;
}

export function loadCompletedOrder(): CompletedOrder | null {
  try {
    const stored = window.sessionStorage.getItem(COMPLETED_ORDER_STORAGE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    return isCompletedOrder(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
