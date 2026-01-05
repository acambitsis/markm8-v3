// Decimal arithmetic helpers for credit operations
// Credits are stored as strings (e.g., "1.00") for JSON compatibility
// Internally uses integer cents to avoid floating point precision issues

/**
 * Convert decimal string to integer cents
 * "1.00" -> 100, "0.50" -> 50
 */
function toCents(decimal: string): number {
  // Multiply by 100 and round to avoid floating point issues
  return Math.round(Number.parseFloat(decimal) * 100);
}

/**
 * Convert integer cents to decimal string
 * 100 -> "1.00", 50 -> "0.50"
 */
function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Add two decimal strings
 * Uses integer cents internally to avoid precision issues
 */
export function addDecimal(a: string, b: string): string {
  return fromCents(toCents(a) + toCents(b));
}

/**
 * Subtract two decimal strings (a - b)
 * Uses integer cents internally to avoid precision issues
 */
export function subtractDecimal(a: string, b: string): string {
  return fromCents(toCents(a) - toCents(b));
}

/**
 * Compare two decimal strings
 * Returns: negative if a < b, zero if equal, positive if a > b
 */
export function compareDecimal(a: string, b: string): number {
  return toCents(a) - toCents(b);
}

/**
 * Check if a decimal string is greater than or equal to another
 */
export function isGreaterOrEqual(a: string, b: string): boolean {
  return toCents(a) >= toCents(b);
}

/**
 * Check if a decimal string is positive (greater than zero)
 */
export function isPositive(amount: string): boolean {
  return toCents(amount) > 0;
}

/**
 * Check if a decimal string is negative (less than zero)
 */
export function isNegative(amount: string): boolean {
  return toCents(amount) < 0;
}

/**
 * Check if a decimal string is zero
 */
export function isZero(amount: string): boolean {
  return toCents(amount) === 0;
}

/**
 * Format a decimal string for display
 */
export function formatCredits(amount: string): string {
  return Number.parseFloat(amount).toFixed(2);
}
