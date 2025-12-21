import useSWR from 'swr';

import type { AssignmentBrief, GradeFeedback, ModelResult, PercentageRange } from '@/models/Schema';

type GradeStatus = 'queued' | 'processing' | 'complete' | 'failed';

type GradeData = {
  id: string;
  essayId: string;
  status: GradeStatus;
  letterGradeRange: string | null;
  percentageRange: PercentageRange | null;
  feedback: GradeFeedback | null;
  modelResults: ModelResult[] | null;
  errorMessage: string | null;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  essay: {
    id: string;
    assignmentBrief: AssignmentBrief | null;
    wordCount: number | null;
    submittedAt: string | null;
  } | null;
};

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch grade');
  }
  return res.json();
});

export function useGradeStatus(gradeId: string) {
  const { data, error, isLoading, mutate } = useSWR<GradeData>(
    `/api/grades/${gradeId}`,
    fetcher,
    {
      // Fast polling (2s) while queued or processing
      // Stop polling when complete or failed
      refreshInterval: (data) => {
        if (!data) {
          return 2000;
        }
        if (data.status === 'queued' || data.status === 'processing') {
          return 2000;
        }
        return 0; // Stop polling
      },
      revalidateOnFocus: true,
    },
  );

  return {
    grade: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
