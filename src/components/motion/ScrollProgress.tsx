'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

type ScrollProgressBarProps = {
  className?: string;
};

export function ScrollProgressBar({ className = '' }: ScrollProgressBarProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className={`fixed left-0 right-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600 ${className}`}
      style={{ scaleX }}
    />
  );
}

type ParallaxSectionProps = {
  children: React.ReactNode;
  className?: string;
  speed?: number;
};

export function ParallaxSection({
  children,
  className = '',
  speed = 0.5,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

type ScrollFadeProps = {
  children: React.ReactNode;
  className?: string;
};

export function ScrollFade({ children, className = '' }: ScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [60, 0, 0]);
  const blur = useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, 0]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        opacity,
        y,
        filter: useTransform(blur, v => `blur(${v}px)`),
      }}
    >
      {children}
    </motion.div>
  );
}

type StickyRevealProps = {
  children: React.ReactNode;
  className?: string;
  height?: string;
};

export function StickyReveal({
  children,
  className = '',
  height = '200vh',
}: StickyRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <div ref={ref} className={`relative ${className}`} style={{ height }}>
      <div className="sticky top-0 flex h-screen items-center justify-center">
        <motion.div style={{ scale, opacity }}>{children}</motion.div>
      </div>
    </div>
  );
}
