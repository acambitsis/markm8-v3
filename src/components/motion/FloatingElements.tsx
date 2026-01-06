'use client';

import { motion } from 'framer-motion';

import { cn } from '@/utils/Helpers';

type FloatingOrbProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'violet' | 'purple' | 'peach' | 'blue';
  speed?: 'slow' | 'medium' | 'fast';
  delay?: number;
};

const sizeClasses = {
  sm: 'size-32',
  md: 'size-64',
  lg: 'size-96',
  xl: 'size-[500px]',
};

const colorClasses = {
  violet: 'bg-violet-400/30',
  purple: 'bg-purple-500/20',
  peach: 'bg-amber-300/20',
  blue: 'bg-blue-400/20',
};

const animationClasses = {
  slow: 'animate-float-slow',
  medium: 'animate-float-medium',
  fast: 'animate-float-fast',
};

export function FloatingOrb({
  className = '',
  size = 'md',
  color = 'violet',
  speed = 'slow',
  delay = 0,
}: FloatingOrbProps) {
  return (
    <motion.div
      className={cn(
        'pointer-events-none absolute rounded-full blur-3xl',
        sizeClasses[size],
        colorClasses[color],
        animationClasses[speed],
        className,
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
    />
  );
}

type MorphingBlobProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
};

const blobSizes = {
  sm: 'size-48',
  md: 'size-72',
  lg: 'size-96',
};

export function MorphingBlob({
  className = '',
  size = 'md',
  color = 'bg-gradient-to-br from-violet-400/40 to-purple-500/40',
}: MorphingBlobProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute animate-morph blur-2xl',
        blobSizes[size],
        color,
        className,
      )}
    />
  );
}

type GlowingDotProps = {
  className?: string;
  color?: 'violet' | 'amber' | 'green';
  pulse?: boolean;
};

const dotColors = {
  violet: 'bg-violet-500',
  amber: 'bg-amber-400',
  green: 'bg-green-500',
};

export function GlowingDot({ className = '', color = 'violet', pulse = true }: GlowingDotProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      <span className={cn('size-2 rounded-full', dotColors[color])} />
      {pulse && (
        <span
          className={cn(
            'absolute inline-flex size-full animate-ping rounded-full opacity-75',
            dotColors[color],
          )}
        />
      )}
    </span>
  );
}

type SparkleProps = {
  className?: string;
};

export function Sparkle({ className = '' }: SparkleProps) {
  return (
    <motion.svg
      className={cn('size-4', className)}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatDelay: Math.random() * 2,
      }}
    >
      <path
        d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
        fill="currentColor"
      />
    </motion.svg>
  );
}

type SparkleGroupProps = {
  count?: number;
  className?: string;
};

// Deterministic sparkle positions to avoid hydration mismatch
const SPARKLE_POSITIONS = [
  { left: 15, top: 20 },
  { left: 85, top: 15 },
  { left: 25, top: 75 },
  { left: 75, top: 80 },
  { left: 50, top: 10 },
  { left: 10, top: 50 },
  { left: 90, top: 45 },
  { left: 60, top: 65 },
  { left: 35, top: 35 },
  { left: 70, top: 25 },
];

export function SparkleGroup({ count = 5, className = '' }: SparkleGroupProps) {
  const positions = SPARKLE_POSITIONS.slice(0, count);

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {positions.map((pos, i) => (
        <motion.div
          key={`sparkle-${pos.left}-${pos.top}`}
          className="absolute text-amber-400/60"
          style={{
            left: `${pos.left}%`,
            top: `${pos.top}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.2 }}
        >
          <Sparkle />
        </motion.div>
      ))}
    </div>
  );
}

type GridPatternProps = {
  className?: string;
};

export function GridPattern({ className = '' }: GridPatternProps) {
  return (
    <svg
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}
