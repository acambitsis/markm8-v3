'use client';

import { CreditCard, FileText, TrendingUp, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/features/admin/StatsCard';
import { useAdminDashboardStats, useAdminRecentActivity } from '@/hooks/useAdmin';

export default function AdminDashboardPage() {
  const t = useTranslations('AdminDashboard');
  const { stats, isLoading: isStatsLoading } = useAdminDashboardStats();
  const { activity, isLoading: isActivityLoading } = useAdminRecentActivity(10);

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
    switch (type) {
      case 'signup':
        return <Users className="size-4" />;
      case 'purchase':
        return <CreditCard className="size-4" />;
      case 'essay':
        return <FileText className="size-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('total_users')}
          value={stats?.totalUsers ?? 0}
          description={`${stats?.recentSignups ?? 0} in last 7 days`}
          icon={<Users className="size-4" />}
          isLoading={isStatsLoading}
        />
        <StatsCard
          title={t('essays_today')}
          value={stats?.essaysToday ?? 0}
          description={`${stats?.totalEssays ?? 0} total`}
          icon={<FileText className="size-4" />}
          isLoading={isStatsLoading}
        />
        <StatsCard
          title={t('credits_purchased')}
          value={`$${stats?.totalCreditsPurchased ?? '0.00'}`}
          icon={<TrendingUp className="size-4" />}
          isLoading={isStatsLoading}
        />
        <StatsCard
          title={t('recent_signups')}
          value={stats?.recentSignups ?? 0}
          description="Last 7 days"
          icon={<Users className="size-4" />}
          isLoading={isStatsLoading}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recent_activity')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isActivityLoading
            ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              )
            : activity.length === 0
              ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('no_activity')}
                  </p>
                )
              : (
                  <div className="space-y-3">
                    {activity.map((item, index) => (
                      <div
                        key={`${item.type}-${item.timestamp}-${index}`}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-muted p-2">
                            {getActivityIcon(item.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.email}
                              {item.amount && ` - $${item.amount}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
        </CardContent>
      </Card>
    </div>
  );
}
