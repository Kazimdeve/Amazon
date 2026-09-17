export interface Savings {
  readonly amountCents: number;
  readonly percentage: number;
}

export function calculateSavings(priceCents: number, listPriceCents: number): Savings | null {
  if (!Number.isInteger(priceCents) || !Number.isInteger(listPriceCents)) {
    throw new TypeError('Prices must be provided as integer cents');
  }

  if (priceCents < 0 || listPriceCents < 0) {
    throw new RangeError('Prices cannot be negative');
  }

  if (listPriceCents <= priceCents) {
    return null;
  }

  const amountCents = listPriceCents - priceCents;

  return {
    amountCents,
    percentage: Math.round((amountCents / listPriceCents) * 100),
  };
}
