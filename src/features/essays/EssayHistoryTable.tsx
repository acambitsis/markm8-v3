'use client';

import { formatDistanceToNow } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import useSWR from 'swr';

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
import type { AssignmentBrief } from '@/models/Schema';

type Essay = {
  id: string;
  assignmentBrief: AssignmentBrief | null;
  submittedAt: string | null;
  wordCount: number | null;
  grade: {
    id: string;
    status: 'queued' | 'processing' | 'complete' | 'failed';
    letterGradeRange: string | null;
  } | null;
};

type PaginatedResponse = {
  essays: Essay[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function EssayHistoryTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useSWR<PaginatedResponse>(
    `/api/essays/list?page=${page}&search=${encodeURIComponent(search)}`,
    fetcher,
  );

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const essays = data?.essays ?? [];
  const pagination = data?.pagination;

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
                      key={essay.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (essay.grade) {
                          window.location.href = `/grades/${essay.grade.id}`;
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
                                href={`/grades/${essay.grade.id}`}
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
                        {essay.grade?.letterGradeRange ?? '-'}
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
      {pagination && pagination.totalPages > 1 && (
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
