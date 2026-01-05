'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/Helpers';

type StatsCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  isLoading?: boolean;
  className?: string;
};

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading,
  className,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
          {description && <Skeleton className="mt-1 h-3 w-32" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p
            className={cn(
              'mt-1 text-xs',
              trend.value >= 0 ? 'text-green-600' : 'text-red-600',
            )}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}
            {' '}
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
