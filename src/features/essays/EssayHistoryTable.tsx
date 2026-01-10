'use client';

import { useConvexAuth, useQuery } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { GradeBadge } from '@/components/GradeBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const essays = data.essays;
  const pagination = data.pagination;

  return (
    <div className="space-y-4">
      {/* Search */}
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
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="secondary">
          Search
        </Button>
      </div>

      {/* Table */}
      {essays.length === 0
        ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? `No essays found matching "${search}"` : 'No essays yet. Submit your first essay to get started!'}
            </div>
          )
        : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Words</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {essays.map(essay => (
                    <TableRow
                      key={essay._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (essay.grade) {
                          router.push(`/grades/${essay.grade._id}`);
                        }
                      }}
                    >
                      <TableCell className="font-medium">
                        {essay.submittedAt
                          ? formatDistanceToNow(new Date(essay.submittedAt), { addSuffix: true })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {essay.grade
                          ? (
                              <Link
                                href={`/grades/${essay.grade._id}`}
                                className="hover:underline"
                              >
                                {essay.assignmentBrief?.title ?? 'Untitled'}
                              </Link>
                            )
                          : (essay.assignmentBrief?.title ?? 'Untitled')}
                      </TableCell>
                      <TableCell>
                        {essay.wordCount?.toLocaleString() ?? '-'}
                      </TableCell>
                      <TableCell>
                        {essay.grade?.percentageRange
                          ? <GradeBadge percentageRange={essay.grade.percentageRange} />
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {essay.grade && <StatusBadge status={essay.grade.status} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing
            {' '}
            {(page - 1) * pagination.pageSize + 1}
            -
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
      )}
    </div>
  );
}
