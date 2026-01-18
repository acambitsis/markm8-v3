'use client';

import { motion, useInView, type Variants } from 'framer-motion';
import { useRef } from 'react';

type TextRevealProps = {
  children: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  once?: boolean;
};

export function TextReveal({
  children,
  className,
  delay = 0,
  staggerDelay = 0.03,
  once = true,
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, margin: '-50px' });

  const words = children.split(' ');

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(10px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.span
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
    >
      {words.map((word, index) => (

        <motion.span
          key={`${word}-${index}`} // eslint-disable-line react/no-array-index-key -- words can repeat, index ensures uniqueness
          variants={wordVariants}
          className="inline-block"
        >
          {word}
          {index < words.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </motion.span>
  );
}

type CharacterRevealProps = {
  children: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  once?: boolean;
};

export function CharacterReveal({
  children,
  className,
  delay = 0,
  staggerDelay = 0.02,
  once = true,
}: CharacterRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, margin: '-50px' });

  const characters = children.split('');

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const charVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 50,
      rotateX: -90,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.span
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      style={{ perspective: 1000 }}
    >
      {characters.map((char, index) => (

        <motion.span
          key={`${char}-${index}`} // eslint-disable-line react/no-array-index-key -- chars repeat, index ensures uniqueness
          variants={charVariants}
          className="inline-block"
          style={{ transformOrigin: 'bottom' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
