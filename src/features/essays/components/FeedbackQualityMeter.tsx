'use client';

import { motion } from 'framer-motion';

import { cn } from '@/utils/Helpers';

type Props = {
  score: number; // 0-100
};

function getQualityLabel(score: number): { label: string; color: string } {
  if (score >= 80) {
    return { label: 'Exceptional', color: 'text-green-600' };
  }
  if (score >= 60) {
    return { label: 'Great', color: 'text-green-600' };
  }
  if (score >= 40) {
    return { label: 'Good', color: 'text-amber-600' };
  }
  return { label: 'Basic', color: 'text-muted-foreground' };
}

function getBarColor(score: number): string {
  if (score >= 80) {
    return 'bg-green-500';
  }
  if (score >= 60) {
    return 'bg-green-500';
  }
  if (score >= 40) {
    return 'bg-amber-500';
  }
  return 'bg-muted-foreground/30';
}

export function FeedbackQualityMeter({ score }: Props) {
  const { label, color } = getQualityLabel(score);
  const barColor = getBarColor(score);

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Feedback Quality</span>
        <span className={cn('font-medium', color)}>{label}</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn('absolute inset-y-0 left-0 rounded-full', barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Add more context below for more specific, actionable feedback
      </p>
    </div>
  );
}
