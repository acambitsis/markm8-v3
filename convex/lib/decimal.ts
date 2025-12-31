// Decimal arithmetic helpers for credit operations
// Credits are stored as strings to maintain precision (e.g., "1.00")

/**
 * Add two decimal strings
 */
export function addDecimal(a: string, b: string): string {
  return (Number.parseFloat(a) + Number.parseFloat(b)).toFixed(2);
}

/**
 * Subtract two decimal strings (a - b)
 */
export function subtractDecimal(a: string, b: string): string {
  return (Number.parseFloat(a) - Number.parseFloat(b)).toFixed(2);
}

/**
 * Compare two decimal strings
 * Returns: negative if a < b, zero if equal, positive if a > b
 */
export function compareDecimal(a: string, b: string): number {
  return Number.parseFloat(a) - Number.parseFloat(b);
}

/**
 * Check if a decimal string is greater than or equal to another
 */
export function isGreaterOrEqual(a: string, b: string): boolean {
  return compareDecimal(a, b) >= 0;
}

/**
 * Format a decimal string for display (adds currency symbol if needed)
 */
export function formatCredits(amount: string): string {
  return Number.parseFloat(amount).toFixed(2);
}
