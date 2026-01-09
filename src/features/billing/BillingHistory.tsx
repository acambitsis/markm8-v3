'use client';

import { useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/Skeleton';
import { Badge } from '@/components/ui/badge';
import { getTransactionStyle } from '@/features/admin/colors';
import { staggerContainer, staggerItem } from '@/features/admin/motion';
import { cn } from '@/utils/Helpers';

import { api } from '../../../convex/_generated/api';

export function BillingHistory() {
  const t = useTranslations('BillingHistory');
  const transactions = useQuery(api.credits.getTransactionHistory);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (transactions === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center">
        <CreditCard className="mx-auto size-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">{t('no_transactions')}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="divide-y rounded-lg border"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {transactions.map((tx) => {
        const style = getTransactionStyle(tx.transactionType);
        const isNegative = tx.amount.startsWith('-');
        const Icon = style.icon;

        return (
          <motion.div
            key={tx._id}
            className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
            variants={staggerItem}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex size-10 items-center justify-center rounded-full',
                style.bg,
              )}
              >
                <Icon className={cn('size-4', style.text)} />
              </div>
              <div>
                <Badge
                  variant="secondary"
                  className={cn('text-xs', style.bg, style.text)}
                >
                  {t(`type_${tx.transactionType}`)}
                </Badge>
                {tx.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tx.description}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                'font-semibold tabular-nums',
                isNegative ? 'text-red-600' : 'text-green-600',
              )}
              >
                {isNegative ? '' : '+'}
                {tx.amount}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(tx.createdAt)}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
