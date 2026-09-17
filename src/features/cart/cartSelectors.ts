import { catalog } from '../../data/catalog';
import { calculateSavings } from '../../lib/pricing';
import type { Product, ProductVariant } from '../catalog/types';
import type { CartLine } from './cartReducer';

export interface ResolvedCartItem {
  readonly line: CartLine;
  readonly product: Product;
  readonly variant?: ProductVariant;
  readonly unitPriceCents: number;
  readonly unitSavingsCents: number;
  readonly savingsPercentage?: number;
}

export interface CartTotals {
  readonly subtotalCents: number;
  readonly savingsCents: number;
  readonly listTotalCents: number;
  readonly totalCents: number;
}

export function resolveCartItems(lines: readonly CartLine[]): readonly ResolvedCartItem[] {
  return lines.flatMap((line) => {
    const product = catalog.find((candidate) => candidate.id === line.productId);
    if (!product) return [];
    const variant = product.variants.find(
      (candidate) => candidate.id === line.variantId,
    ) as ProductVariant | undefined;
    const unitPriceCents = variant?.priceCents ?? product.priceCents;
    const savings = calculateSavings(unitPriceCents, product.listPriceCents);

    return [{
      line,
      product,
      variant,
      unitPriceCents,
      unitSavingsCents: savings?.amountCents ?? 0,
      ...(savings ? { savingsPercentage: savings.percentage } : {}),
    }];
  });
}

export function calculateCartTotals(items: readonly ResolvedCartItem[]): CartTotals {
  const subtotalCents = items.reduce(
    (total, item) => total + item.unitPriceCents * item.line.quantity,
    0,
  );
  const savingsCents = items.reduce(
    (total, item) => total + item.unitSavingsCents * item.line.quantity,
    0,
  );

  return {
    subtotalCents,
    savingsCents,
    listTotalCents: subtotalCents + savingsCents,
    totalCents: subtotalCents,
  };
}
