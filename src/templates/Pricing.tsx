'use client';

import { motion, useInView } from 'framer-motion';
import { ArrowRight, Brain, Check, FileText, MessageSquare, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { FloatingOrb } from '@/components/motion/FloatingElements';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { cn } from '@/utils/Helpers';

export const Pricing = () => {
  const t = useTranslations('Pricing');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const includedFeatures = [
    { icon: Brain, textKey: 'included_ai_models' as const, delay: 0 },
    { icon: FileText, textKey: 'included_breakdown' as const, delay: 0.1 },
    { icon: MessageSquare, textKey: 'included_feedback' as const, delay: 0.2 },
    { icon: Check, textKey: 'included_rubric' as const, delay: 0.3 },
  ];

  const trustBadges = [
    { textKey: 'trust_no_expiry' as const, icon: Zap },
    { textKey: 'trust_secure' as const, icon: Check },
    { textKey: 'trust_fast' as const, icon: Sparkles },
  ];

  return (
    <div id="pricing" className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <FloatingOrb
          className="-left-40 top-1/4"
          size="lg"
          color="violet"
          speed="slow"
        />
        <FloatingOrb
          className="-right-32 bottom-1/4"
          size="md"
          color="peach"
          speed="medium"
          delay={0.5}
        />
      </div>

      <Section
        subtitle={t('section_subtitle')}
        title={t('section_title')}
        description={t('section_description')}
      >
        <div ref={ref} className="relative mx-auto max-w-lg">
          {/* Main pricing card */}
          <motion.div
            className="group relative"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Animated glow behind card */}
            <motion.div
              className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 opacity-20 blur-2xl"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ backgroundSize: '200% 200%' }}
            />

            {/* Card */}
            <motion.div
              className="relative overflow-hidden rounded-3xl border-2 border-violet-200 bg-white p-8 shadow-xl md:p-10"
              whileHover={{ y: -4, boxShadow: '0 25px 50px -12px rgba(124, 58, 237, 0.25)' }}
              transition={{ duration: 0.3 }}
            >
              {/* Popular badge */}
              <motion.div
                className="absolute -right-12 top-6 rotate-45 bg-gradient-to-r from-violet-600 to-purple-600 px-12 py-1 text-xs font-semibold text-white shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Most Popular
              </motion.div>

              {/* Subtle grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: `linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(90deg, #7c3aed 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Content */}
              <div className="relative">
                {/* Price */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <p className="text-sm font-medium uppercase tracking-wider text-violet-600">
                    {t('price_label')}
                  </p>
                  <div className="mt-3 flex items-baseline justify-center gap-1">
                    <span className="text-6xl font-bold tracking-tight text-slate-900 md:text-7xl">
                      {isInView
                        ? (
                            <AnimatedNumber value={0.25} prefix="$" decimals={2} duration={1.5} delay={0.3} />
                          )
                        : (
                            '$0.25'
                          )}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{t('price_note')}</p>
                </motion.div>

                {/* Divider with gradient */}
                <motion.div
                  className="my-8 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                />

                {/* What's included */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                    {t('included_title')}
                  </p>
                  {includedFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.textKey}
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                    >
                      <motion.div
                        className="flex size-8 items-center justify-center rounded-lg bg-violet-100"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      >
                        <feature.icon className="size-4 text-violet-600" />
                      </motion.div>
                      <span className="text-slate-700">{t(feature.textKey)}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative"
                  >
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600 opacity-70 blur transition-opacity group-hover:opacity-100" />
                    <Link
                      href="/sign-up"
                      className={cn(
                        buttonVariants({ size: 'lg' }),
                        'relative w-full gap-2 rounded-xl bg-violet-600 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:bg-violet-700',
                      )}
                    >
                      {t('cta_button')}
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ArrowRight className="size-5" />
                      </motion.span>
                    </Link>
                  </motion.div>
                  <p className="mt-4 text-center text-xs text-slate-500">{t('cta_note')}</p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            {trustBadges.map(badge => (
              <motion.div
                key={badge.textKey}
                className="flex items-center gap-2 text-slate-600"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <div className="flex size-6 items-center justify-center rounded-full bg-emerald-100">
                  <badge.icon className="size-3.5 text-emerald-600" />
                </div>
                <span>{t(badge.textKey)}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>
    </div>
  );
};
