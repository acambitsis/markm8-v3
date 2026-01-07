// Pricing validation helpers
// Shared validation logic for pricing values across all entry points

/**
 * Validates a pricing value (decimal string)
 * - Must be a valid number (not NaN)
 * - Must be positive (> 0)
 *
 * @param value - The decimal string to validate (e.g., "1.00")
 * @param fieldName - The field name for error messages
 * @returns The parsed number value
 * @throws Error if validation fails
 */
export function validatePricingValue(value: string, fieldName: string): number {
  const parsed = Number.parseFloat(value);

  if (Number.isNaN(parsed)) {
    throw new TypeError(`${fieldName} must be a valid number`);
  }

  if (parsed <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }

  return parsed;
}

/**
 * Validates both pricing values and returns parsed numbers
 * Used before division to ensure safe arithmetic
 *
 * @param gradingCostPerEssay - Credits charged per essay (e.g., "1.00")
 * @param creditsPerDollar - Credits per dollar spent (e.g., "1.00")
 * @returns Object with parsed values ready for calculation
 * @throws Error if any validation fails
 */
export function validatePricing(
  gradingCostPerEssay: string,
  creditsPerDollar: string,
): { gradingCost: number; creditsPerDollar: number } {
  const gradingCost = validatePricingValue(gradingCostPerEssay, 'Grading cost');
  const cpd = validatePricingValue(creditsPerDollar, 'Credits per dollar');

  return { gradingCost, creditsPerDollar: cpd };
}

/**
 * Calculates price per essay in USD
 * Validates inputs before division to prevent division by zero
 *
 * @param gradingCostPerEssay - Credits charged per essay
 * @param creditsPerDollar - Credits per dollar spent
 * @returns Price per essay as formatted string (e.g., "1.00")
 * @throws Error if inputs are invalid
 */
export function calculatePricePerEssay(
  gradingCostPerEssay: string,
  creditsPerDollar: string,
): string {
  const { gradingCost, creditsPerDollar: cpd } = validatePricing(
    gradingCostPerEssay,
    creditsPerDollar,
  );

  const pricePerEssay = gradingCost / cpd;
  return pricePerEssay.toFixed(2);
}
