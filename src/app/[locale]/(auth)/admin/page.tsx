'use client';

import type { Id } from 'convex/_generated/dataModel';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, CreditCard, Eye, FileText, Settings, Shield, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { ModelTimings } from '@/components/ModelTimings';
import { PageTransition } from '@/components/motion/PageTransition';
import { Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui/button';
import { getActivityStyle } from '@/features/admin/colors';
import { GradeViewSheet } from '@/features/admin/GradeViewSheet';
import { staggerContainerSlow, staggerItemSlow } from '@/features/admin/motion';
import { StatsCard } from '@/features/admin/StatsCard';
import { useAdminDashboardStats, useAdminRecentActivity } from '@/hooks/useAdmin';
import { cn } from '@/utils/Helpers';

export default function AdminDashboardPage() {
  const t = useTranslations('AdminDashboard');
  const { stats, isLoading: isStatsLoading } = useAdminDashboardStats();
  const { activity, isLoading: isActivityLoading } = useAdminRecentActivity(10);
  const [selectedGradeId, setSelectedGradeId] = useState<Id<'grades'> | null>(null);
  const [gradeSheetOpen, setGradeSheetOpen] = useState(false);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return `${diffDays}d ago`;
  };

  const getActivityIcon = (type: string) => {
    const style = getActivityStyle(type);
    const Icon = style.icon;
    return <Icon className={cn('size-4', style.text)} />;
  };

  return (
    <PageTransition>
      {/* Hero Section */}
      <motion.section
        className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 size-48 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <motion.div
              className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Shield className="size-4" />
              Admin Dashboard
            </motion.div>
            <motion.h1
              className="text-2xl font-bold tracking-tight md:text-3xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {t('title')}
            </motion.h1>
            <motion.p
              className="mt-2 text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {t('description')}
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <section className="mb-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={t('total_users')}
            value={stats?.totalUsers ?? 0}
            description={`${stats?.recentSignups ?? 0} in last 7 days`}
            icon={<Users className="size-5" />}
            color="purple"
            isLoading={isStatsLoading}
            delay={0}
          />
          <StatsCard
            title={t('essays_today')}
            value={stats?.essaysToday ?? 0}
            description={`${stats?.totalEssays ?? 0} total`}
            icon={<FileText className="size-5" />}
            color="green"
            isLoading={isStatsLoading}
            delay={0.1}
          />
          <StatsCard
            title={t('credits_purchased')}
            value={`£${stats?.totalCreditsPurchased ?? '0.00'}`}
            icon={<TrendingUp className="size-5" />}
            color="blue"
            isLoading={isStatsLoading}
            delay={0.2}
          />
          <StatsCard
            title={t('recent_signups')}
            value={stats?.recentSignups ?? 0}
            description="Last 7 days"
            icon={<Users className="size-5" />}
            color="orange"
            isLoading={isStatsLoading}
            delay={0.3}
          />
        </div>
      </section>

      {/* Quick Actions */}
      <motion.section
        className="mb-8 grid gap-4 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Link
          href="/admin/users"
          className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
            <Users className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold group-hover:text-primary">Manage Users</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              View and manage user accounts
            </p>
          </div>
          <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>

        <Link
          href="/admin/transactions"
          className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
            <CreditCard className="size-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold group-hover:text-primary">Transactions</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              View credit transactions
            </p>
          </div>
          <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>

        <Link
          href="/admin/settings"
          className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
            <Settings className="size-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold group-hover:text-primary">Settings</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Configure platform settings
            </p>
          </div>
          <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </Link>
      </motion.section>

      {/* Recent Activity */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Activity className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t('recent_activity')}</h2>
        </div>

        <div className="rounded-xl border bg-card">
          {isActivityLoading
            ? (
                <div className="space-y-1 p-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4 rounded-lg p-3">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              )
            : activity.length === 0
              ? (
                  <p className="py-12 text-center text-muted-foreground">
                    {t('no_activity')}
                  </p>
                )
              : (
                  <motion.div
                    className="divide-y"
                    variants={staggerContainerSlow}
                    initial="hidden"
                    animate="visible"
                  >
                    {activity.map((item, index) => (

                      <motion.div
                        key={`${item.type}-${item.timestamp}-${index}`} // eslint-disable-line react/no-array-index-key -- fallback for non-unique timestamps
                        className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                        variants={staggerItemSlow}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-full',
                            getActivityStyle(item.type).bg,
                          )}
                          >
                            {getActivityIcon(item.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{item.description}</p>
                              {/* Show model timings for essay activities */}
                              {item.type === 'essay' && item.modelResults && item.modelResults.length > 0 && (
                                <ModelTimings modelResults={item.modelResults} compact />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.email}
                              {item.amount && (
                                <span className="ml-1 text-green-600">
                                  +£
                                  {item.amount}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.type === 'essay' && item.gradeId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => {
                                setSelectedGradeId(item.gradeId!);
                                setGradeSheetOpen(true);
                              }}
                            >
                              <Eye className="size-4" />
                              View Grade
                            </Button>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(item.timestamp)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
        </div>
      </motion.section>

      {/* Grade View Dialog */}
      <GradeViewSheet
        gradeId={selectedGradeId}
        open={gradeSheetOpen}
        onOpenChange={(open) => {
          setGradeSheetOpen(open);
          if (!open) {
            setSelectedGradeId(null);
          }
        }}
      />
    </PageTransition>
  );
}
