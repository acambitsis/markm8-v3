'use client';

import { motion, useInView } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { FloatingOrb, MorphingBlob } from '@/components/motion/FloatingElements';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { cn } from '@/utils/Helpers';

export const CTASection = () => {
  const t = useTranslations('CTA');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div className="px-4 py-20 lg:py-28">
      <div ref={ref} className="mx-auto max-w-5xl">
        <motion.div
          className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem]"
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-800">
            {/* Animated gradient overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-violet-600/30 via-purple-500/30 to-indigo-600/30"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ backgroundSize: '200% 200%' }}
            />
          </div>

          {/* Decorative elements */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <FloatingOrb
              className="-left-20 -top-20"
              size="lg"
              color="violet"
              speed="slow"
            />
            <FloatingOrb
              className="-bottom-32 -right-20"
              size="xl"
              color="purple"
              speed="medium"
              delay={0.5}
            />
            <MorphingBlob
              className="-right-10 top-1/2 -translate-y-1/2"
              size="lg"
              color="bg-white/5"
            />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />

            {/* Radial highlight */}
            <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/20 blur-[100px]" />
          </div>

          {/* Content */}
          <div className="relative px-8 py-16 text-center md:px-16 md:py-20 lg:py-24">
            {/* Badge */}
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Zap className="size-4 text-amber-400" />
              <span className="text-sm font-medium text-white/90">Get started in under 2 minutes</span>
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-balance text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {t('title')}
            </motion.h2>

            {/* Description */}
            <motion.p
              className="mx-auto mt-5 max-w-xl text-pretty text-lg text-violet-100/80 md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {t('description')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="relative"
              >
                {/* Animated glow */}
                <motion.div
                  className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-400 via-white to-amber-400 opacity-70 blur-md"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{ backgroundSize: '200% 200%' }}
                />
                <Link
                  href="/sign-up"
                  prefetch={false}
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'relative h-14 gap-2 rounded-xl bg-white px-8 text-lg font-semibold text-violet-900 shadow-xl transition-all hover:bg-violet-50',
                  )}
                >
                  <Sparkles className="size-5" />
                  {t('primary_button')}
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="size-5" />
                  </motion.span>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/sign-in"
                  prefetch={false}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'lg' }),
                    'h-14 rounded-xl border border-white/20 bg-white/5 px-8 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white',
                  )}
                >
                  {t('secondary_button')}
                </Link>
              </motion.div>
            </motion.div>

            {/* Note */}
            <motion.p
              className="mt-6 text-sm text-violet-200/60"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {t('note')}
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
