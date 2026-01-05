'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminUsers } from '@/hooks/useAdmin';

export default function AdminUsersPage() {
  const t = useTranslations('AdminUsers');
  const [search, setSearch] = useState('');
  const { users, isLoading } = useAdminUsers(search || undefined);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            <Input
              placeholder={t('search_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mt-2 max-w-sm"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading
            ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              )
            : users.length === 0
              ? (
                  <p className="py-8 text-center text-muted-foreground">
                    {t('no_users')}
                  </p>
                )
              : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('email')}</TableHead>
                          <TableHead>{t('name')}</TableHead>
                          <TableHead className="text-right">{t('credits')}</TableHead>
                          <TableHead className="text-right">{t('essays')}</TableHead>
                          <TableHead>{t('joined')}</TableHead>
                          <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map(user => (
                          <TableRow key={user._id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.name ?? '-'}</TableCell>
                            <TableCell className="text-right">{user.creditBalance}</TableCell>
                            <TableCell className="text-right">{user.essayCount}</TableCell>
                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/users/${user._id}`}>{t('view')}</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
        </CardContent>
      </Card>
    </div>
  );
}
