export const SUCCESS_CARD_NUMBER = '4242424242424242';
export const DECLINED_CARD_NUMBER = '4000000000000002';

export interface CardFields {
  readonly cardholderName: string;
  readonly cardNumber: string;
  readonly expiry: string;
  readonly cvv: string;
}

export type CardFieldErrors = Partial<Record<keyof CardFields, string>>;

export function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function validateCardFields(fields: CardFields, now = new Date()): CardFieldErrors {
  const errors: CardFieldErrors = {};
  const cardNumber = fields.cardNumber.replace(/\s/g, '');

  if (!fields.cardholderName.trim()) {
    errors.cardholderName = 'Enter the cardholder name.';
  }

  if (!cardNumber) {
    errors.cardNumber = 'Enter a test card number.';
  } else if (!/^\d{16}$/.test(cardNumber)) {
    errors.cardNumber = 'Enter a 16-digit card number.';
  } else if (![SUCCESS_CARD_NUMBER, DECLINED_CARD_NUMBER].includes(cardNumber)) {
    errors.cardNumber = 'Use one of the test card numbers shown below.';
  }

  const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(fields.expiry);
  if (!fields.expiry) {
    errors.expiry = 'Enter an expiry date.';
  } else if (!expiryMatch) {
    errors.expiry = 'Use the MM/YY format.';
  } else {
    const month = Number(expiryMatch[1]);
    const year = 2000 + Number(expiryMatch[2]);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (month < 1 || month > 12) {
      errors.expiry = 'Enter a valid month.';
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      errors.expiry = 'This expiry date has passed.';
    }
  }

  if (!fields.cvv) {
    errors.cvv = 'Enter a CVV.';
  } else if (!/^\d{3}$/.test(fields.cvv)) {
    errors.cvv = 'Enter a 3-digit CVV.';
  }

  return errors;
}
