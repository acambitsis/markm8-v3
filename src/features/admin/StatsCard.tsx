'use client';

import { motion } from 'framer-motion';

import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/utils/Helpers';

type ColorVariant = 'purple' | 'green' | 'blue' | 'orange' | 'default';

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
  color?: ColorVariant;
  delay?: number;
  animate?: boolean;
};

const colorClasses: Record<ColorVariant, string> = {
  purple: 'bg-primary/10 text-primary',
  green: 'bg-green-500/10 text-green-600',
  blue: 'bg-blue-500/10 text-blue-600',
  orange: 'bg-orange-500/10 text-orange-600',
  default: 'bg-muted text-muted-foreground',
};

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading,
  className,
  color = 'default',
  delay = 0,
  animate = true,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-card p-4 shadow-sm', className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="size-11 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
      </div>
    );
  }

  // Parse numeric value for animation
  const numericValue = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  const isNumeric = !Number.isNaN(numericValue);
  const prefix = typeof value === 'string' && value.startsWith('£') ? '£' : '';

  const content = (
    <div className={cn('flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md', className)}>
      {icon && (
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', colorClasses[color])}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold tabular-nums">
          {animate && isNumeric
            ? (
                <>
                  {prefix}
                  <AnimatedNumber value={numericValue} decimals={prefix === '£' || String(value).includes('.') ? 2 : 0} duration={1} delay={delay} />
                </>
              )
            : value}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p
            className={cn(
              'mt-0.5 text-xs font-medium',
              trend.value >= 0 ? 'text-green-600' : 'text-red-600',
            )}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}
            {' '}
            {trend.label}
          </p>
        )}
      </div>
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {content}
    </motion.div>
  );
}
