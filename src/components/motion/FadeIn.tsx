'use client';

import { motion, type Variants } from 'framer-motion';

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  once?: boolean;
};

const getDirectionOffset = (direction: FadeInProps['direction'], distance: number) => {
  switch (direction) {
    case 'up':
      return { y: distance };
    case 'down':
      return { y: -distance };
    case 'left':
      return { x: distance };
    case 'right':
      return { x: -distance };
    default:
      return {};
  }
};

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance = 24,
  once = true,
}: FadeInProps) {
  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...getDirectionOffset(direction, distance),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // ease-out-quart
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-50px' }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

// Staggered fade-in for groups of items
type FadeInStaggerProps = {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
  direction?: FadeInProps['direction'];
  distance?: number;
  once?: boolean;
};

export function FadeInStagger({
  children,
  className,
  staggerDelay = 0.1,
  initialDelay = 0,
  direction = 'up',
  distance = 24,
  once = true,
}: FadeInStaggerProps) {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      ...getDirectionOffset(direction, distance),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-50px' }}
      variants={containerVariants}
    >
      {/* Clone children and wrap in motion.div */}
      {Array.isArray(children)
        ? children.map((child, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        ))
        : <motion.div variants={itemVariants}>{children}</motion.div>}
    </motion.div>
  );
}
