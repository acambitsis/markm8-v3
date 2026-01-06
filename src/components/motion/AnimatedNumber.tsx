'use client';

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';

type AnimatedNumberProps = {
  value: number;
  className?: string;
  duration?: number;
  delay?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
};

export function AnimatedNumber({
  value,
  className,
  duration = 1,
  delay = 0,
  decimals = 0,
  suffix = '',
  prefix = '',
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, latest =>
    `${prefix}${latest.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const controls = animate(motionValue, value, {
        duration,
        ease: [0.25, 0.1, 0.25, 1],
      });
      return () => controls.stop();
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [motionValue, value, duration, delay]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
