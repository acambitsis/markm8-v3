'use client';

import { motion, useInView } from 'framer-motion';
import { Clock, GraduationCap, Shield, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

export const TrustStrip = () => {
  const t = useTranslations('TrustStrip');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const trustItems = [
    { icon: GraduationCap, textKey: 'university_grade' as const, color: 'text-violet-500' },
    { icon: Shield, textKey: 'privacy' as const, color: 'text-emerald-500' },
    { icon: Clock, textKey: 'speed' as const, color: 'text-blue-500' },
    { icon: Sparkles, textKey: 'ai_models' as const, color: 'text-amber-500' },
  ];

  // Duplicate for seamless loop
  const allItems = [...trustItems, ...trustItems];

  return (
    <div
      ref={ref}
      className="relative overflow-hidden border-y border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80"
    >
      {/* Gradient edges for fade effect */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent" />

      {/* Desktop: Static grid */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex items-center justify-center gap-x-12">
            {trustItems.map((item, index) => (
              <motion.div
                key={item.textKey}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <motion.div
                  className={`flex size-10 items-center justify-center rounded-xl bg-slate-100 ${item.color}`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <item.icon className="size-5" />
                </motion.div>
                <span className="text-sm font-medium text-slate-700">{t(item.textKey)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: Animated marquee */}
      <div className="md:hidden">
        <div className="py-4">
          <motion.div
            className="flex gap-8"
            animate={{
              x: [0, -50 * allItems.length],
            }}
            transition={{
              x: {
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              },
            }}
          >
            {allItems.map((item, index) => (
              <div
                key={`mobile-${item.textKey}-${index}`}
                className="flex shrink-0 items-center gap-2.5"
              >
                <div
                  className={`flex size-8 items-center justify-center rounded-lg bg-slate-100 ${item.color}`}
                >
                  <item.icon className="size-4" />
                </div>
                <span className="whitespace-nowrap text-sm font-medium text-slate-700">
                  {t(item.textKey)}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Subtle animated line */}
      <motion.div
        className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isInView ? { scaleX: 1, opacity: 0.5 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ width: '100%', transformOrigin: 'center' }}
      />
    </div>
  );
};
