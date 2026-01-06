'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type ScaleInProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  initialScale?: number;
  className?: string;
};

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.5,
  initialScale = 0.9,
  className,
}: ScaleInProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: initialScale,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        scale: initialScale,
      }}
      transition={{
        duration,
        delay,
        ease: [0.34, 1.56, 0.64, 1], // ease-out-back
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
