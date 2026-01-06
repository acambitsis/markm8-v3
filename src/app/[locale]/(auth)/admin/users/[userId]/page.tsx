'use client';

import type { Id } from 'convex/_generated/dataModel';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building,
  Calendar,
  Clock,
  Coins,
  CreditCard,
  FileText,
  Mail,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { PageTransition } from '@/components/motion/PageTransition';
import { Skeleton } from '@/components/Skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CreditAdjustForm } from '@/features/admin/CreditAdjustForm';
import { useAdminUserDetail } from '@/hooks/useAdmin';
import { cn } from '@/utils/Helpers';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

const transactionColors: Record<string, { bg: string; text: string }> = {
  signup_bonus: { bg: 'bg-green-500/10', text: 'text-green-700' },
  purchase: { bg: 'bg-blue-500/10', text: 'text-blue-700' },
  grading: { bg: 'bg-orange-500/10', text: 'text-orange-700' },
  refund: { bg: 'bg-purple-500/10', text: 'text-purple-700' },
  admin_adjustment: { bg: 'bg-primary/10', text: 'text-primary' },
};

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

  const formatShortDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!userDetail) {
    return (
      <PageTransition>
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 size-4" />
            {t('back')}
          </Link>
        </Button>
        <div className="rounded-xl border bg-card py-16 text-center">
          <User className="mx-auto size-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">User not found</p>
        </div>
      </PageTransition>
    );
  }

  const { user, credits, transactions, recentEssays } = userDetail;

  return (
    <PageTransition>
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 size-4" />
            {t('back')}
          </Link>
        </Button>
      </motion.div>

      {/* User Header */}
      <motion.div
        className="mb-8 flex items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name ?? user.email.split('@')[0]}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile Card */}
        <motion.div
          className="rounded-xl border bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="border-b p-5">
            <div className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              <h2 className="font-semibold">{t('profile')}</h2>
            </div>
          </div>
          <div className="divide-y">
            <div className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Mail className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('email')}</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <User className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('name')}</p>
                <p className="font-medium">{user.name ?? '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Building className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('institution')}</p>
                <p className="font-medium">{user.institution ?? '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Calendar className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('joined')}</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Credits Card */}
        <motion.div
          className="rounded-xl border bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="border-b p-5">
            <div className="flex items-center gap-2">
              <Coins className="size-5 text-primary" />
              <h2 className="font-semibold">{t('credits')}</h2>
            </div>
          </div>
          <div className="p-5">
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-green-500/10 p-4">
                <p className="text-sm text-muted-foreground">{t('current_balance')}</p>
                <p className="text-3xl font-bold text-green-600">{credits.balance}</p>
              </div>
              <div className="rounded-lg bg-orange-500/10 p-4">
                <p className="text-sm text-muted-foreground">{t('reserved')}</p>
                <p className="text-3xl font-bold text-orange-600">{credits.reserved}</p>
              </div>
            </div>

            <Separator className="my-5" />

            <div>
              <h4 className="mb-4 flex items-center gap-2 font-medium">
                <CreditCard className="size-4 text-muted-foreground" />
                {t('adjust_credits')}
              </h4>
              <CreditAdjustForm
                userId={userId}
                currentBalance={credits.balance}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transaction History */}
      <motion.div
        className="mt-6 rounded-xl border bg-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="border-b p-5">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            <h2 className="font-semibold">{t('transaction_history')}</h2>
          </div>
        </div>
        {transactions.length === 0
          ? (
              <div className="py-12 text-center">
                <CreditCard className="mx-auto size-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">{t('no_transactions')}</p>
              </div>
            )
          : (
              <motion.div
                className="divide-y"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {transactions.map(tx => (
                  <motion.div
                    key={tx._id}
                    className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                    variants={itemVariants}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'flex size-10 items-center justify-center rounded-full',
                        transactionColors[tx.type]?.bg ?? 'bg-muted',
                      )}
                      >
                        <CreditCard className={cn(
                          'size-4',
                          transactionColors[tx.type]?.text ?? 'text-muted-foreground',
                        )}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs',
                              transactionColors[tx.type]?.bg,
                              transactionColors[tx.type]?.text,
                            )}
                          >
                            {tx.type.replace('_', ' ')}
                          </Badge>
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
                      </div>
                    </div>
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
                        {formatShortDate(tx.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
      </motion.div>

      {/* Recent Essays */}
      {recentEssays.length > 0 && (
        <motion.div
          className="mt-6 rounded-xl border bg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="border-b p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <h2 className="font-semibold">{t('recent_essays')}</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {recentEssays.length}
                {' '}
                submissions
              </span>
            </div>
          </div>
          <motion.div
            className="divide-y"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {recentEssays.map(essay => (
              <motion.div
                key={essay._id}
                className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                variants={itemVariants}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'flex size-10 items-center justify-center rounded-lg',
                    essay.status === 'submitted' ? 'bg-green-500/10' : 'bg-muted',
                  )}
                  >
                    <FileText className={cn(
                      'size-5',
                      essay.status === 'submitted' ? 'text-green-600' : 'text-muted-foreground',
                    )}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{essay.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant={essay.status === 'submitted' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {essay.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {essay.submittedAt && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    {formatShortDate(essay.submittedAt)}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </PageTransition>
  );
}
