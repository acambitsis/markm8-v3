'use client';

import { animate, motion, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';

import { cn } from '@/utils/Helpers';

type ScoreGaugeProps = {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
  delay?: number;
};

const sizeConfig = {
  sm: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
  md: { width: 180, strokeWidth: 10, fontSize: 'text-4xl' },
  lg: { width: 240, strokeWidth: 12, fontSize: 'text-5xl' },
};

// Get color based on score
const getScoreColor = (score: number) => {
  if (score >= 90) {
    return { stroke: '#22c55e', bg: '#dcfce7' };
  } // green
  if (score >= 80) {
    return { stroke: '#84cc16', bg: '#ecfccb' };
  } // lime
  if (score >= 70) {
    return { stroke: '#eab308', bg: '#fef9c3' };
  } // yellow
  if (score >= 60) {
    return { stroke: '#f97316', bg: '#ffedd5' };
  } // orange
  return { stroke: '#ef4444', bg: '#fee2e2' }; // red
};

export function ScoreGauge({
  score,
  size = 'md',
  showLabel = true,
  label,
  className,
  delay = 0.3,
}: ScoreGaugeProps) {
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = config.width / 2;

  const [isVisible, setIsVisible] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);
  const motionValue = useMotionValue(0);

  const colors = getScoreColor(score);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true);

      // Animate the score number
      const controls = animate(motionValue, score, {
        duration: 1.5,
        ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
        onUpdate: (latest) => {
          setDisplayedScore(Math.round(latest));
        },
      });

      return () => controls.stop();
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [score, motionValue, delay]);

  // Calculate stroke dashoffset for the progress
  const strokeDashoffset = circumference - (displayedScore / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: config.width, height: config.width }}>
        {/* Background circle */}
        <svg
          className="absolute inset-0"
          width={config.width}
          height={config.width}
          viewBox={`0 0 ${config.width} ${config.width}`}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-muted/30"
          />
        </svg>

        {/* Progress circle */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={config.width}
          height={config.width}
          viewBox={`0 0 ${config.width} ${config.width}`}
        >
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn(config.fontSize, 'font-bold tabular-nums')}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.5 }}
            transition={{ delay: delay + 0.5, duration: 0.3 }}
          >
            {displayedScore}
            <span className="text-lg font-normal text-muted-foreground">%</span>
          </motion.span>
          {showLabel && label && (
            <motion.span
              className="mt-1 text-sm font-medium text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{ delay: delay + 0.7, duration: 0.3 }}
            >
              {label}
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
}
