'use client';

import { useConvexAuth, useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, FileText } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { Badge } from '@/components/ui/badge';
import { getGradeColors } from '@/utils/gradeColors';
import { cn } from '@/utils/Helpers';

import { api } from '../../../convex/_generated/api';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

export function RecentEssaysV2() {
  const { isAuthenticated } = useConvexAuth();
  const essays = useQuery(api.essays.recent, isAuthenticated ? {} : 'skip');

  if (essays === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 rounded-xl border bg-card p-4">
            <Skeleton className="size-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (essays.length === 0) {
    return (
      <EmptyState
        icon="essays"
        title="No essays yet"
        description="Submit your first essay to get AI-powered feedback and improve your writing skills."
        action={{
          label: 'Submit Your First Essay',
          href: '/submit',
        }}
      />
    );
  }

  return (
    <motion.div
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {essays.map(essay => (
        <motion.div key={essay._id} variants={itemVariants}>
          <Link
            href={essay.grade ? `/grades/${essay.grade._id}` : '#'}
            className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-md"
          >
            {/* Icon */}
            <div className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-lg transition-colors',
              essay.grade?.percentageRange
                ? getGradeColors((essay.grade.percentageRange.lower + essay.grade.percentageRange.upper) / 2).light
                : 'bg-muted',
            )}
            >
              <FileText className={cn(
                'size-6',
                essay.grade?.percentageRange
                  ? getGradeColors((essay.grade.percentageRange.lower + essay.grade.percentageRange.upper) / 2).text
                  : 'text-muted-foreground',
              )}
              />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium group-hover:text-primary">
                {essay.assignmentBrief?.title ?? 'Untitled Essay'}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-3.5" />
                <span>
                  {essay.submittedAt
                    ? formatDistanceToNow(new Date(essay.submittedAt), { addSuffix: true })
                    : 'Draft'}
                </span>
                {essay.wordCount && (
                  <>
                    <span className="text-border">·</span>
                    <span>
                      {essay.wordCount.toLocaleString()}
                      {' '}
                      words
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Grade badge and arrow */}
            <div className="flex items-center gap-3">
              {essay.grade?.status === 'complete' && essay.grade.percentageRange && (
                <Badge
                  className={cn(
                    'px-3 py-1 text-sm font-semibold',
                    getGradeColors((essay.grade.percentageRange.lower + essay.grade.percentageRange.upper) / 2).bg,
                    'text-white',
                  )}
                >
                  {essay.grade.percentageRange.lower === essay.grade.percentageRange.upper
                    ? `${essay.grade.percentageRange.lower}%`
                    : `${essay.grade.percentageRange.lower}-${essay.grade.percentageRange.upper}%`}
                </Badge>
              )}
              {essay.grade?.status === 'processing' && (
                <Badge variant="secondary" className="px-3 py-1">
                  <span className="mr-1.5 inline-block size-2 animate-pulse rounded-full bg-primary" />
                  Grading
                </Badge>
              )}
              {essay.grade?.status === 'queued' && (
                <Badge variant="outline" className="px-3 py-1">
                  Queued
                </Badge>
              )}
              <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
