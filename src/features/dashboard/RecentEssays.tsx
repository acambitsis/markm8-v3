'use client';

import { useConvexAuth, useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, FileText, PenLine } from 'lucide-react';
import Link from 'next/link';

import { Shimmer } from '@/components/motion';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/utils/Helpers';

import { api } from '../../../convex/_generated/api';

export function RecentEssays() {
  const { isAuthenticated } = useConvexAuth();
  const essays = useQuery(api.essays.recent, isAuthenticated ? {} : 'skip');

  if (essays === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 rounded-xl bg-muted/30 p-4">
            <Shimmer className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-2/3" />
              <Shimmer className="h-3 w-1/3" />
            </div>
            <Shimmer className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (essays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <FileText className="size-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No essays yet</p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Submit your first essay to get started
        </p>
        <Link
          href="/submit"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <PenLine className="size-4" />
          Submit an essay
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {essays.map((essay, index) => {
        const hasGrade = essay.grade && essay.grade.status === 'complete';
        const isProcessing = essay.grade && ['queued', 'processing'].includes(essay.grade.status);

        return (
          <Link
            key={essay._id}
            href={essay.grade ? `/grades/${essay.grade._id}` : '#'}
            className={cn(
              'group flex items-center gap-4 rounded-xl p-4',
              'transition-all duration-200',
              essay.grade
                ? 'hover:bg-muted/50 cursor-pointer'
                : 'cursor-default opacity-60',
            )}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* Icon */}
            <div className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              'transition-colors duration-200',
              hasGrade
                ? 'bg-success/10 text-success group-hover:bg-success group-hover:text-white'
                : isProcessing
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground',
            )}
            >
              <FileText className="size-5" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">
                  {essay.assignmentBrief?.title ?? 'Untitled Essay'}
                </span>
                {essay.grade && (
                  <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {essay.submittedAt
                  ? formatDistanceToNow(new Date(essay.submittedAt), {
                    addSuffix: true,
                  })
                  : 'Draft'}
                {essay.wordCount && (
                  <span className="ml-2 text-muted-foreground/60">
                    {essay.wordCount.toLocaleString()}
                    {' '}
                    words
                  </span>
                )}
              </div>
            </div>

            {/* Grade / Status */}
            <div className="flex shrink-0 items-center gap-3">
              {hasGrade && essay.grade?.letterGradeRange && (
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {essay.grade.letterGradeRange}
                </span>
              )}
              {essay.grade && <StatusBadge status={essay.grade.status} />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
