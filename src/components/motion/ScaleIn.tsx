'use client';

import { motion, type Variants } from 'framer-motion';

type ScaleInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  initialScale?: number;
};

export function ScaleIn({
  children,
  className,
  delay = 0,
  duration = 0.4,
  initialScale = 0.9,
}: ScaleInProps) {
  const variants: Variants = {
    hidden: {
      opacity: 0,
      scale: initialScale,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration,
        delay,
        ease: [0.34, 1.56, 0.64, 1], // ease-spring
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
