'use client';

import { useConvexAuth, useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

import { StatusBadge } from '@/components/StatusBadge';

import { api } from '../../../convex/_generated/api';

export function RecentEssays() {
  const { isAuthenticated } = useConvexAuth();
  const essays = useQuery(api.essays.recent, isAuthenticated ? {} : 'skip');

  if (essays === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

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
          key={essay._id}
          href={essay.grade ? `/grades/${essay.grade._id}` : '#'}
          className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium">
                {essay.assignmentBrief?.title ?? 'Untitled Essay'}
              </div>
              <div className="text-sm text-muted-foreground">
                {essay.submittedAt
                  ? formatDistanceToNow(new Date(essay.submittedAt), {
                    addSuffix: true,
                  })
                  : 'Draft'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {essay.grade?.letterGradeRange && (
                <span className="font-semibold">
                  {essay.grade.letterGradeRange}
                </span>
              )}
              {essay.grade && <StatusBadge status={essay.grade.status} />}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
