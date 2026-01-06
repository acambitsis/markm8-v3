'use client';

import { motion } from 'framer-motion';
import { CreditCard, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { PageTransition } from '@/components/motion/PageTransition';
import { Skeleton } from '@/components/Skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTransactionStyle } from '@/features/admin/colors';
import { staggerContainer, staggerItem } from '@/features/admin/motion';
import { useAdminTransactions } from '@/hooks/useAdmin';
import { cn } from '@/utils/Helpers';

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    const style = getTransactionStyle(type);
    const Icon = style.icon;
    return <Icon className={cn('size-4', style.text)} />;
  };

  return (
    <PageTransition>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              <h1 className="text-2xl font-bold">{t('title')}</h1>
            </div>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
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
          </div>
        </div>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        className="rounded-xl border bg-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {isLoading
          ? (
              <div className="divide-y">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            )
          : transactions.length === 0
            ? (
                <div className="py-16 text-center">
                  <CreditCard className="mx-auto size-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    {t('no_transactions')}
                  </p>
                </div>
              )
            : (
                <motion.div
                  className="divide-y"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {transactions.map(tx => (
                    <motion.div
                      key={tx._id}
                      className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                      variants={staggerItem}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-full',
                          getTransactionStyle(tx.type).bg,
                        )}
                        >
                          {getTransactionIcon(tx.type)}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs',
                                getTransactionStyle(tx.type).bg,
                                getTransactionStyle(tx.type).text,
                              )}
                            >
                              {tx.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {tx.userEmail}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {tx.description ?? '-'}
                            {tx.adminNote && (
                              <span className="block text-xs italic">
                                Note:
                                {' '}
                                {tx.adminNote}
                              </span>
                            )}
                          </p>
                          {tx.performedBy && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              by
                              {' '}
                              {tx.performedBy}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Amount & Time */}
                      <div className="text-right">
                        <p className={cn(
                          'font-semibold tabular-nums',
                          tx.amount.startsWith('-') ? 'text-red-600' : 'text-green-600',
                        )}
                        >
                          {tx.amount.startsWith('-') ? '' : '+'}
                          {tx.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
      </motion.div>

      {/* Results count */}
      {!isLoading && transactions.length > 0 && (
        <motion.p
          className="mt-4 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {transactions.length}
          {' '}
          transaction
          {transactions.length !== 1 ? 's' : ''}
          {' '}
          {typeFilter !== 'all' && `(${typeFilter.replace('_', ' ')})`}
        </motion.p>
      )}
    </PageTransition>
  );
}
