import type { Variants } from 'framer-motion';

/**
 * Standard stagger animation for admin lists.
 * Use for user lists, transaction lists, essay lists, etc.
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

/**
 * Slower stagger for dashboard activity feed.
 * Creates a more dramatic cascading effect.
 */
export const staggerContainerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/**
 * Standard item entrance animation.
 * Slides up with fade, used with staggerContainer.
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

/**
 * Slower item entrance for dashboard.
 * More dramatic entrance with larger y offset.
 */
export const staggerItemSlow: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};
