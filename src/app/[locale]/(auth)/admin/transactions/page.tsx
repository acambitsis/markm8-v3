'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminTransactions } from '@/hooks/useAdmin';

import type { TransactionType } from '../../../../../../convex/schema';

export default function AdminTransactionsPage() {
  const t = useTranslations('AdminTransactions');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');

  const { transactions, isLoading } = useAdminTransactions({
    transactionType: typeFilter === 'all' ? undefined : typeFilter,
    limit: 100,
  });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Select
              value={typeFilter}
              onValueChange={v => setTypeFilter(v as TransactionType | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter_all')}</SelectItem>
                <SelectItem value="signup_bonus">{t('filter_signup_bonus')}</SelectItem>
                <SelectItem value="purchase">{t('filter_purchase')}</SelectItem>
                <SelectItem value="grading">{t('filter_grading')}</SelectItem>
                <SelectItem value="refund">{t('filter_refund')}</SelectItem>
                <SelectItem value="admin_adjustment">{t('filter_admin')}</SelectItem>
              </SelectContent>
            </Select>
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
            : transactions.length === 0
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
                          <TableHead>{t('date')}</TableHead>
                          <TableHead>{t('user')}</TableHead>
                          <TableHead>{t('type')}</TableHead>
                          <TableHead className="text-right">{t('amount')}</TableHead>
                          <TableHead>{t('description_col')}</TableHead>
                          <TableHead>{t('performed_by')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map(tx => (
                          <TableRow key={tx._id}>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(tx.createdAt)}
                            </TableCell>
                            <TableCell>{tx.userEmail}</TableCell>
                            <TableCell>
                              <Badge variant={getTransactionTypeBadge(tx.type)}>
                                {tx.type.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                tx.amount.startsWith('-')
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {tx.amount.startsWith('-') ? '' : '+'}
                              {tx.amount}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="truncate">{tx.description ?? '-'}</div>
                              {tx.adminNote && (
                                <div className="truncate text-xs text-muted-foreground">
                                  Note:
                                  {' '}
                                  {tx.adminNote}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{tx.performedBy ?? '-'}</TableCell>
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
