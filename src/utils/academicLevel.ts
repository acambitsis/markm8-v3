/**
 * Academic level validation utilities
 * Single source of truth for runtime validation of academic levels
 */
import type { AcademicLevel } from '../../convex/schema';

/**
 * Valid academic levels - must stay in sync with academicLevelValidator in convex/schema.ts
 */
export const VALID_ACADEMIC_LEVELS: readonly AcademicLevel[] = [
  'high_school',
  'undergraduate',
  'postgraduate',
  'professional',
] as const;

/**
 * Type guard to check if a value is a valid AcademicLevel
 */
export function isAcademicLevel(value: unknown): value is AcademicLevel {
  return typeof value === 'string' && VALID_ACADEMIC_LEVELS.includes(value as AcademicLevel);
}
