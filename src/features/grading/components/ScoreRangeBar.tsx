'use client';

import { animate, motion, useMotionValue } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getGradeThreshold } from '@/utils/gradeColors';
import { cn } from '@/utils/Helpers';

import type { PercentageRange } from '../../../../convex/schema';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type StatItem = { value: number; label: string; color: string };

type GradingRun = { model: string };

type Props = {
  percentageRange: PercentageRange;
  gradingRuns: GradingRun[];
  stats: StatItem[];
  delay?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Pure Functions
// ─────────────────────────────────────────────────────────────────────────────

/** Compute target window: clamp to deciles containing the range */
const computeTargetWindow = (lower: number, upper: number) => ({
  start: Math.max(0, Math.floor(lower / 10) * 10),
  end: Math.min(100, Math.ceil(upper / 10) * 10),
});

/** Build confidence band gradient */
const bandGradient = (hex: string): string =>
  `linear-gradient(to right,
    transparent 0%, ${hex}40 15%, ${hex}90 35%,
    ${hex} 50%,
    ${hex}90 65%, ${hex}40 85%, transparent 100%)`;

// ─────────────────────────────────────────────────────────────────────────────
// Animation Configuration
// ─────────────────────────────────────────────────────────────────────────────

// Timing constants - band and zoom happen simultaneously
const ZOOM_START = 1.5;
const ZOOM_DURATION = 0.625;
const BAND_START = ZOOM_START; // Start together with zoom

const TIMING = {
  scaleIn: 0.5,
  zoomStart: ZOOM_START,
  zoomDuration: ZOOM_DURATION,
  bandStart: BAND_START,
  bandDuration: 6.0,
  scoreStart: 1.2,
  statsStart: BAND_START + 3.0,
  disclaimerStart: BAND_START + 4.0, // Show sooner
} as const;

const EASING = {
  smooth: [0.4, 0, 0.2, 1] as [number, number, number, number],
  springy: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  zoom: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

// ─────────────────────────────────────────────────────────────────────────────
// Animated Range Display - Numbers Roll from Midpoint to Final Values
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedRangeDisplay({
  lower,
  upper,
  delay,
  duration,
  className,
}: {
  lower: number;
  upper: number;
  delay: number;
  duration: number;
  className?: string;
}) {
  const mid = (lower + upper) / 2;
  const isRange = lower !== upper;

  // Motion values for smooth number interpolation
  const lowerValue = useMotionValue(mid);
  const upperValue = useMotionValue(mid);

  // State for rendering with decimals during animation
  const [displayedLower, setDisplayedLower] = useState(mid);
  const [displayedUpper, setDisplayedUpper] = useState(mid);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Subscribe to raw motion value changes (not rounded)
    const unsubLower = lowerValue.on('change', setDisplayedLower);
    const unsubUpper = upperValue.on('change', setDisplayedUpper);

    // Animate after delay, synced with band reveal
    const timer = setTimeout(() => {
      setIsAnimating(true);
      // Use smooth easeOut for number rolling - no overshoot
      animate(lowerValue, lower, {
        duration,
        ease: [0.16, 1, 0.3, 1],
        onComplete: () => setIsAnimating(false),
      });
      animate(upperValue, upper, {
        duration,
        ease: [0.16, 1, 0.3, 1],
      });
    }, delay * 1000);

    return () => {
      unsubLower();
      unsubUpper();
      clearTimeout(timer);
    };
  }, [lower, upper, delay, duration, lowerValue, upperValue]);

  // Format number: show 1 decimal while animating, integer when done
  const formatNum = (value: number, target: number): string => {
    if (!isAnimating || Math.abs(value - target) < 0.05) {
      return Math.round(value).toString();
    }
    return value.toFixed(1);
  };

  // Show range or single value based on whether they've diverged
  const hasDiverged = Math.abs(displayedLower - displayedUpper) > 0.1;
  const showRange = isRange && hasDiverged;

  return (
    <span className={className}>
      {showRange
        ? (
            <>
              {formatNum(displayedLower, lower)}
              <span className="mx-px">–</span>
              {formatNum(displayedUpper, upper)}
              %
            </>
          )
        : (
            <>
              {formatNum(displayedLower, lower)}
              %
            </>
          )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated Scale Component - The Heart of the Visualization
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedScale({
  windowStart,
  windowEnd,
  gradeHex,
  gradeLower,
  gradeUpper,
  showBand,
  delay,
}: {
  windowStart: number;
  windowEnd: number;
  gradeHex: string;
  gradeLower: number;
  gradeUpper: number;
  showBand: boolean;
  delay: number;
}) {
  const windowSize = windowEnd - windowStart;

  // Generate all markers we might need (0-100 at 5% intervals)
  const allMarkers = Array.from({ length: 21 }, (_, i) => i * 5);

  // Filter to visible markers and compute positions
  const visibleMarkers = allMarkers.filter(v => v >= windowStart && v <= windowEnd);

  // Position calculation
  const pos = (value: number) => ((value - windowStart) / windowSize) * 100;

  // Band calculations
  const bandStart = pos(gradeLower);
  const bandWidth = ((gradeUpper - gradeLower) / windowSize) * 100;

  return (
    <div className="relative">
      {/* Container with bar - full height band */}
      <div className="relative h-12 overflow-hidden rounded-lg border border-border/50 bg-muted/40">
        {/* Gradation lines - animate position */}
        {visibleMarkers.map((value) => {
          const major = value % 10 === 0;
          return (
            <motion.div
              key={`grid-${value}`}
              className={cn(
                'absolute top-0 h-full w-px',
                major ? 'bg-foreground/20' : 'bg-foreground/10',
              )}
              initial={{ left: `${((value - 0) / 100) * 100}%` }}
              animate={{ left: `${pos(value)}%` }}
              transition={{
                delay: delay + TIMING.zoomStart,
                duration: TIMING.zoomDuration,
                ease: EASING.zoom,
              }}
            />
          );
        })}

        {/* Confidence band - full height */}
        {showBand && (
          <motion.div
            className="absolute inset-y-0"
            style={{ background: bandGradient(gradeHex) }}
            initial={{ left: `${bandStart}%`, width: `${bandWidth}%`, scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
              duration: TIMING.bandDuration,
              ease: EASING.springy,
            }}
          />
        )}
      </div>

      {/* Scale labels - outside container */}
      <div className="relative mt-1.5 h-4 px-0">
        {visibleMarkers.map((value) => {
          const major = value % 10 === 0;
          return (
            <motion.span
              key={`label-${value}`}
              className={cn(
                'absolute -translate-x-1/2 font-semibold tabular-nums',
                major ? 'text-[11px] text-foreground/70' : 'text-[10px] text-foreground/50',
              )}
              initial={{
                left: `${((value - 0) / 100) * 100}%`,
                opacity: 0,
              }}
              animate={{
                left: `${pos(value)}%`,
                opacity: 1,
              }}
              transition={{
                left: {
                  delay: delay + TIMING.zoomStart,
                  duration: TIMING.zoomDuration,
                  ease: EASING.zoom,
                },
                opacity: {
                  delay: delay + TIMING.scaleIn,
                  duration: 0.4,
                },
              }}
            >
              {value}
              %
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Score Display Component - Positioned above the confidence band
// ─────────────────────────────────────────────────────────────────────────────

function ScoreDisplay({
  lower,
  upper,
  target,
  textColor,
  delay,
}: {
  lower: number;
  upper: number;
  target: { start: number; end: number };
  textColor: string;
  delay: number;
}) {
  const windowSize = target.end - target.start;
  const bandCenter = (lower + upper) / 2;
  const bandCenterPos = ((bandCenter - target.start) / windowSize) * 100;

  return (
    <div className="relative mb-3 h-14">
      <motion.div
        className="absolute flex -translate-x-1/2 flex-col items-center"
        initial={{ opacity: 0, y: -10, left: '50%' }}
        animate={{ opacity: 1, y: 0, left: `${bandCenterPos}%` }}
        transition={{
          opacity: { delay: delay + TIMING.scoreStart, duration: 0.5 },
          y: { delay: delay + TIMING.scoreStart, duration: 0.5, ease: EASING.smooth },
          left: { delay: delay + TIMING.zoomStart, duration: TIMING.zoomDuration, ease: EASING.zoom },
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + TIMING.scoreStart + 0.1, duration: 0.5, ease: EASING.springy }}
        >
          <AnimatedRangeDisplay
            lower={lower}
            upper={upper}
            delay={delay + TIMING.bandStart}
            duration={TIMING.bandDuration}
            className={cn('text-3xl font-bold tabular-nums tracking-tight sm:text-4xl', textColor)}
          />
        </motion.div>
        <motion.p
          className="text-[11px] font-medium tracking-wide text-muted-foreground/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + TIMING.scoreStart + 0.2, duration: 0.3 }}
        >
          ESTIMATED RANGE
        </motion.p>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function ScoreRangeBar({ percentageRange, gradingRuns, stats, delay = 0 }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [showBand, setShowBand] = useState(false);

  // Derived values
  const { lower, upper } = percentageRange;
  const midScore = (lower + upper) / 2;
  const { hex, text: textColor } = getGradeThreshold(midScore);
  const target = computeTargetWindow(lower, upper);

  // Trigger band reveal exactly when zoom completes
  useEffect(() => {
    const timer = setTimeout(
      () => setShowBand(true),
      (delay + TIMING.bandStart) * 1000,
    );
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="w-full space-y-3">
      {/* Two-column layout: Bar with centered score above | Stats */}
      <div className="flex items-start gap-4 sm:gap-6">
        {/* Left: Bar with score centered above the confidence band */}
        <div className="relative min-w-0 flex-1">
          {/* Score display positioned above the band's center */}
          <ScoreDisplay
            lower={lower}
            upper={upper}
            target={target}
            textColor={textColor}
            delay={delay}
          />

          {/* Animated scale with smooth zoom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + TIMING.scaleIn, duration: 0.4 }}
          >
            <AnimatedScale
              windowStart={target.start}
              windowEnd={target.end}
              gradeHex={hex}
              gradeLower={lower}
              gradeUpper={upper}
              showBand={showBand}
              delay={delay}
            />
          </motion.div>
        </div>

        {/* Right: Stats as polished metric badges */}
        <motion.div
          className="shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + TIMING.statsStart, duration: 0.4, ease: EASING.smooth }}
        >
          <div className="flex flex-col gap-1.5">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2.5 py-1',
                  stat.color === 'text-green-600' && 'bg-green-500/10',
                  stat.color === 'text-amber-600' && 'bg-amber-500/10',
                  stat.color === 'text-blue-600' && 'bg-blue-500/10',
                )}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + TIMING.statsStart + i * 0.12, duration: 0.4 }}
              >
                <span className={cn('text-lg font-bold tabular-nums leading-none', stat.color)}>
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* AI Grading Runs - subtle, expandable */}
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground/70 transition-colors hover:bg-muted/50 hover:text-muted-foreground">
              <Sparkles className="size-3" />
              <span className="font-medium">
                {gradingRuns.length}
                {' '}
                grading run
                {gradingRuns.length !== 1 ? 's' : ''}
              </span>
              <ChevronDown className={cn('size-3 transition-transform', showDetails && 'rotate-180')} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1.5">
              <div className="flex flex-col gap-1">
                {gradingRuns.map((run, index) => (

                  <span
                    key={index} // eslint-disable-line react/no-array-index-key -- display-only, no reordering
                    className="rounded bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    <span className="font-medium">
                      Run
                      {index + 1}
                      :
                    </span>
                    {' '}
                    {run.model}
                  </span>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      </div>

      {/* Disclaimer - subtle, informative */}
      <motion.p
        className="text-center text-xs leading-relaxed text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + TIMING.disclaimerStart, duration: 0.5 }}
      >
        Grades are inherently subjective—this range reflects high confidence, not certainty.
        {' '}
        <span className="font-medium">
          What matters most: acting on the feedback will move your grade in the right direction.
        </span>
      </motion.p>
    </div>
  );
}
