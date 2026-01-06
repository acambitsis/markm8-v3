'use client';

import { useConvexAuth, useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight, FileText, PenLine, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { Shimmer, SlideIn } from '@/components/motion';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/Helpers';

import { api } from '../../../convex/_generated/api';

export function EssayHistoryTable() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const data = useQuery(
    api.essays.list,
    isAuthenticated ? { page, search: search || undefined } : 'skip',
  );

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  if (data === undefined) {
    return (
      <div className="space-y-4">
        {/* Search skeleton */}
        <div className="flex gap-2">
          <Shimmer className="h-10 flex-1 rounded-lg" />
          <Shimmer className="h-10 w-20 rounded-lg" />
        </div>
        {/* List skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4 rounded-xl bg-muted/30 p-4">
              <Shimmer className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-1/2" />
                <Shimmer className="h-3 w-1/4" />
              </div>
              <Shimmer className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const essays = data.essays;
  const pagination = data.pagination;

  return (
    <div className="space-y-6">
      {/* Search */}
      <SlideIn direction="up" delay={0}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search essays..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            Search
          </Button>
        </div>
      </SlideIn>

      {/* Essays List */}
      {essays.length === 0
        ? (
            <SlideIn direction="up" delay={0.1}>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                  <FileText className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">
                  {search ? 'No results found' : 'No essays yet'}
                </h3>
                <p className="mt-1 text-muted-foreground">
                  {search
                    ? `No essays match "${search}"`
                    : 'Submit your first essay to get started'}
                </p>
                {!search && (
                  <Button asChild className="mt-6">
                    <Link href="/submit">
                      <PenLine className="mr-2 size-4" />
                      Submit an Essay
                    </Link>
                  </Button>
                )}
              </div>
            </SlideIn>
          )
        : (
            <div className="space-y-2">
              {essays.map((essay, index) => {
                const hasGrade = essay.grade && essay.grade.status === 'complete';

                return (
                  <motion.div
                    key={essay._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <div
                      role={essay.grade ? 'button' : undefined}
                      tabIndex={essay.grade ? 0 : undefined}
                      onClick={() => {
                        if (essay.grade) {
                          router.push(`/grades/${essay.grade._id}`);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (essay.grade && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          router.push(`/grades/${essay.grade._id}`);
                        }
                      }}
                      className={cn(
                        'group flex items-center gap-4 rounded-xl border bg-card p-4',
                        'transition-all duration-200',
                        essay.grade
                          ? 'cursor-pointer hover:bg-muted/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring'
                          : 'cursor-default opacity-60',
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-lg',
                          'transition-colors duration-200',
                          hasGrade
                            ? 'bg-success/10 text-success group-hover:bg-success group-hover:text-white'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <FileText className="size-5" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {essay.grade
                            ? (
                                <Link
                                  href={`/grades/${essay.grade._id}`}
                                  className="truncate font-medium hover:underline"
                                  onClick={e => e.stopPropagation()}
                                >
                                  {essay.assignmentBrief?.title ?? 'Untitled'}
                                </Link>
                              )
                            : (
                                <span className="truncate font-medium">
                                  {essay.assignmentBrief?.title ?? 'Untitled'}
                                </span>
                              )}
                          {essay.grade && (
                            <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                          <span>
                            {essay.submittedAt
                              ? formatDistanceToNow(new Date(essay.submittedAt), { addSuffix: true })
                              : 'Draft'}
                          </span>
                          {essay.wordCount && (
                            <>
                              <span className="text-muted-foreground/40">•</span>
                              <span>
                                {essay.wordCount.toLocaleString()}
                                {' '}
                                words
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Grade & Status */}
                      <div className="flex shrink-0 items-center gap-3">
                        {hasGrade && essay.grade?.letterGradeRange && (
                          <span className="text-lg font-semibold tabular-nums">
                            {essay.grade.letterGradeRange}
                          </span>
                        )}
                        {essay.grade && <StatusBadge status={essay.grade.status} />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <SlideIn direction="up" delay={0.2}>
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing
              {' '}
              {(page - 1) * pagination.pageSize + 1}
              –
              {Math.min(page * pagination.pageSize, pagination.total)}
              {' '}
              of
              {' '}
              {pagination.total}
              {' '}
              essays
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="mr-1 size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Next
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </SlideIn>
      )}
    </div>
  );
}
