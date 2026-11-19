const AMOUNT_PATTERN = /^(\d+)(?:[.,](\d{1,2}))?$/;

/**
 * Parses a user-typed amount such as "12", "12.5" or "12,50" into integer cents.
 * Accepts either "." or "," as the decimal separator and at most two decimals.
 * Spaces are ignored; thousands separators are not supported, so "1.234" is rejected rather
 * than guessed at.
 * Returns `null` for anything that is not a valid non-negative amount.
 */
export function parseAmountToCents(input: string): number | null {
  const match = AMOUNT_PATTERN.exec(input.trim().replace(/\s/g, ''));
  if (!match) return null;
  const whole = match[1] ?? '0';
  const fraction = (match[2] ?? '').padEnd(2, '0');
  const cents = Number(whole) * 100 + Number(fraction);
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Formats cents as a plain decimal string ("1234" -> "12.34"), for pre-filling inputs. */
export function centsToDecimalString(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

export function isValidCents(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}
