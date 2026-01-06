'use client';

import { motion } from 'framer-motion';

type AnimatedCheckmarkProps = {
  size?: number;
  strokeWidth?: number;
  color?: string;
  delay?: number;
  className?: string;
};

export function AnimatedCheckmark({
  size = 24,
  strokeWidth = 2,
  color = 'currentColor',
  delay = 0,
  className,
}: AnimatedCheckmarkProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay,
        ease: [0.34, 1.56, 0.64, 1], // ease-out-back
      }}
    >
      {/* Circle */}
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 0.4,
          delay: delay + 0.1,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
      {/* Checkmark */}
      <motion.path
        d="M9 12l2 2 4-4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 0.3,
          delay: delay + 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
    </motion.svg>
  );
}
