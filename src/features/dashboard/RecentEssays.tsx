'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import useSWR from 'swr';

import { StatusBadge } from '@/components/StatusBadge';
import type { AssignmentBrief } from '@/models/Schema';

type Essay = {
  id: string;
  assignmentBrief: AssignmentBrief | null;
  submittedAt: string | null;
  grade: {
    id: string;
    status: 'queued' | 'processing' | 'complete' | 'failed';
    letterGradeRange: string | null;
  } | null;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function RecentEssays() {
  const { data, isLoading } = useSWR<{ essays: Essay[] }>(
    '/api/essays/recent',
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  const essays = data?.essays ?? [];

  if (essays.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No essays yet. Submit your first essay to get started!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {essays.map(essay => (
        <Link
          key={essay.id}
          href={essay.grade ? `/grades/${essay.grade.id}` : '#'}
          className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium">
                {essay.assignmentBrief?.title ?? 'Untitled Essay'}
              </div>
              <div className="text-sm text-muted-foreground">
                {essay.submittedAt
                  ? formatDistanceToNow(new Date(essay.submittedAt), { addSuffix: true })
                  : 'Draft'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {essay.grade?.letterGradeRange && (
                <span className="font-semibold">{essay.grade.letterGradeRange}</span>
              )}
              {essay.grade && <StatusBadge status={essay.grade.status} />}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
