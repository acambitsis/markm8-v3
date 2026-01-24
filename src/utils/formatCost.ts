/**
 * Format API cost for display
 * Shows more decimal places for small amounts
 */
export function formatApiCost(cost: string | undefined): string {
  if (!cost) {
    return '-';
  }
  const value = Number.parseFloat(cost);
  if (Number.isNaN(value) || value === 0) {
    return '-';
  }

  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }
  if (value < 1) {
    return `$${value.toFixed(3)}`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Format token count for display
 * Uses K/M suffixes for readability
 */
export function formatTokens(tokens: number | undefined): string {
  if (!tokens) {
    return '-';
  }
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}
