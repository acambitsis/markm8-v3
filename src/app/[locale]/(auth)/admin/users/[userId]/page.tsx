'use client';

import type { Id } from 'convex/_generated/dataModel';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreditAdjustForm } from '@/features/admin/CreditAdjustForm';
import { useAdminUserDetail } from '@/hooks/useAdmin';
import { cn } from '@/utils/Helpers';

export default function AdminUserDetailPage() {
  const t = useTranslations('AdminUserDetail');
  const params = useParams();
  const userId = params.userId as Id<'users'>;

  const { userDetail, isLoading } = useAdminUserDetail(userId);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      signup_bonus: 'secondary',
      purchase: 'default',
      grading: 'destructive',
      refund: 'outline',
      admin_adjustment: 'secondary',
    };
    return variants[type] ?? 'default';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 size-4" />
            {t('back')}
          </Link>
        </Button>
        <p className="text-center text-muted-foreground">User not found</p>
      </div>
    );
  }

  const { user, credits, transactions, recentEssays } = userDetail;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 size-4" />
          {t('back')}
        </Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('email')}</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('name')}</p>
              <p className="font-medium">{user.name ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('institution')}</p>
              <p className="font-medium">{user.institution ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('joined')}</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Credits Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('credits')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('current_balance')}</p>
                <p className="text-2xl font-bold">{credits.balance}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('reserved')}</p>
                <p className="text-2xl font-bold">{credits.reserved}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-3 font-medium">{t('adjust_credits')}</h4>
              <CreditAdjustForm
                userId={userId}
                currentBalance={credits.balance}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('transaction_history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0
            ? (
                <p className="py-8 text-center text-muted-foreground">
                  {t('no_transactions')}
                </p>
              )
            : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(tx => (
                        <TableRow key={tx._id}>
                          <TableCell>{formatDate(tx.createdAt)}</TableCell>
                          <TableCell>
                            <Badge variant={getTransactionTypeBadge(tx.type)}>
                              {tx.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-medium',
                              tx.amount.startsWith('-')
                                ? 'text-red-600'
                                : 'text-green-600',
                            )}
                          >
                            {tx.amount.startsWith('-') ? '' : '+'}
                            {tx.amount}
                          </TableCell>
                          <TableCell>{tx.description ?? '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {tx.adminNote ?? '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
        </CardContent>
      </Card>

      {/* Recent Essays */}
      {recentEssays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('recent_essays')}</CardTitle>
            <CardDescription>
              {recentEssays.length}
              {' '}
              recent submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEssays.map(essay => (
                    <TableRow key={essay._id}>
                      <TableCell className="font-medium">{essay.title}</TableCell>
                      <TableCell>
                        <Badge variant={essay.status === 'submitted' ? 'default' : 'secondary'}>
                          {essay.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {essay.submittedAt ? formatDate(essay.submittedAt) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
