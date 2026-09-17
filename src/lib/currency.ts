export function formatCurrency(
  cents: number,
  locale = 'en-US',
  currency = 'USD',
): string {
  if (!Number.isInteger(cents)) {
    throw new TypeError('Currency values must be provided as integer cents');
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}
