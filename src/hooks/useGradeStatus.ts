'use client';

import { useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

/**
 * Hook to get grade status and results
 * Uses Convex real-time subscription - no polling needed!
 * The UI will automatically update when the grade status changes
 */
export function useGradeStatus(gradeId: Id<'grades'>) {
  const grade = useQuery(api.grades.getById, {
    id: gradeId,
  });

  return {
    grade,
    isLoading: grade === undefined,
    isError: grade === null,
    // No refresh needed - Convex subscriptions auto-update
    // When the grading action completes, this hook will automatically
    // receive the updated grade with status: 'complete' or 'failed'
  };
}
