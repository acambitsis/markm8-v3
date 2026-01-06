'use client';

import { useConvexAuth, useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import { Coins, FileCheck, TrendingUp } from 'lucide-react';

import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { Skeleton } from '@/components/Skeleton';
import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/utils/Helpers';

import { api } from '../../../convex/_generated/api';

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  suffix?: string;
  color: 'purple' | 'green' | 'blue';
  delay?: number;
};

const colorClasses = {
  purple: 'bg-primary/10 text-primary',
  green: 'bg-green-500/10 text-green-600',
  blue: 'bg-blue-500/10 text-blue-600',
};

function StatCard({ icon, label, value, suffix, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className={cn('flex size-11 items-center justify-center rounded-lg', colorClasses[color])}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums">
          {value}
          {suffix && <span className="text-base font-normal text-muted-foreground">{suffix}</span>}
        </p>
      </div>
    </motion.div>
  );
}

export function StatsBar() {
  const { isAuthenticated } = useConvexAuth();
  const { credits, isLoading: creditsLoading } = useCredits();
  const stats = useQuery(api.essays.getStats, isAuthenticated ? {} : 'skip');

  const creditsValue = Number.parseFloat(credits?.available ?? '0');
  const totalEssays = stats?.total ?? 0;
  const averageGrade = stats?.averageGrade ?? null;

  if (creditsLoading || stats === undefined) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="size-11 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        icon={<Coins className="size-5" />}
        label="Credits Available"
        value={<AnimatedNumber value={creditsValue} decimals={2} duration={1} />}
        color="purple"
        delay={0}
      />
      <StatCard
        icon={<FileCheck className="size-5" />}
        label="Essays Graded"
        value={<AnimatedNumber value={totalEssays} duration={1} delay={0.1} />}
        color="green"
        delay={0.1}
      />
      <StatCard
        icon={<TrendingUp className="size-5" />}
        label="Average Grade"
        value={
          averageGrade !== null
            ? <AnimatedNumber value={averageGrade} suffix="%" duration={1} delay={0.2} />
            : <span className="text-muted-foreground">—</span>
        }
        color="blue"
        delay={0.2}
      />
    </div>
  );
}
