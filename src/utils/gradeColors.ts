// Grade color utilities
// Shared color mapping for percentage-based grade display

export type GradeColorSet = {
  bg: string;
  text: string;
  light: string;
};

/**
 * Get color classes based on percentage grade
 * Returns a set of Tailwind color classes for different use cases
 *
 * Thresholds:
 * - 90%+ → Green (excellent)
 * - 80%+ → Blue (good)
 * - 70%+ → Yellow (satisfactory)
 * - 60%+ → Orange (needs improvement)
 * - <60% → Red (failing)
 */
export function getGradeColors(percentage: number): GradeColorSet {
  if (percentage >= 90) {
    return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' };
  }
  if (percentage >= 80) {
    return { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' };
  }
  if (percentage >= 70) {
    return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50' };
  }
  if (percentage >= 60) {
    return { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' };
  }
  return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' };
}
