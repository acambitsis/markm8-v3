'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

import { cn } from '@/utils/Helpers';

export const Section = (props: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
  id?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      id={props.id}
      className={cn('px-4 py-20 lg:py-28', props.className)}
    >
      {(props.title || props.subtitle || props.description) && (
        <div className="mx-auto mb-16 max-w-3xl text-center">
          {props.subtitle && (
            <motion.div
              className="mb-4 inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-semibold text-violet-700"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {props.subtitle}
            </motion.div>
          )}

          {props.title && (
            <motion.h2
              className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {props.title}
            </motion.h2>
          )}

          {props.description && (
            <motion.p
              className="mt-4 text-pretty text-lg text-slate-600 md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {props.description}
            </motion.p>
          )}
        </div>
      )}

      <div className="mx-auto max-w-6xl">{props.children}</div>
    </section>
  );
};
