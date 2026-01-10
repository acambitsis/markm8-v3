// Grade color utilities
// Shared color mapping for percentage-based grade display

import type { PercentageRange } from '../../convex/schema';

export type GradeColorSet = {
  bg: string;
  text: string;
  light: string;
};

/**
 * Grade color thresholds - single source of truth
 * Thresholds: 90+ green, 80+ blue, 70+ yellow, 60+ orange, else red
 */
const GRADE_THRESHOLDS: Array<{
  min: number;
  hex: string;
  bg: string;
  text: string;
  light: string;
}> = [
  { min: 90, hex: '#22c55e', bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' },
  { min: 80, hex: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
  { min: 70, hex: '#eab308', bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50' },
  { min: 60, hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
  { min: 0, hex: '#ef4444', bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' },
];

function getGradeThreshold(percentage: number) {
  return GRADE_THRESHOLDS.find(t => percentage >= t.min) ?? GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1]!;
}

/**
 * Get hex color based on percentage grade
 */
export function getGradeHex(percentage: number): string {
  return getGradeThreshold(percentage).hex;
}

/**
 * Get color classes based on percentage grade
 * Returns a set of Tailwind color classes for different use cases
 */
export function getGradeColors(percentage: number): GradeColorSet {
  const t = getGradeThreshold(percentage);
  return { bg: t.bg, text: t.text, light: t.light };
}

/**
 * Format a percentage range for display
 * Shows single value if lower === upper, otherwise shows "lower-upper%"
 */
export function formatPercentageRange(range: PercentageRange): string {
  return range.lower === range.upper
    ? `${range.lower}%`
    : `${range.lower}-${range.upper}%`;
}
