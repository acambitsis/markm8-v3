'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronDown, GraduationCap, Lock, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import { FloatingOrb, SparkleGroup } from '@/components/motion/FloatingElements';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { cn } from '@/utils/Helpers';

export const ToolHero = () => {
  const t = useTranslations('Hero');
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  // Stats: first is a feature callout (no animated number), others are animated
  const animatedStats = [
    { value: 4.9, decimals: 1, label: 'User Rating' },
    { value: 2, suffix: ' min', label: 'Avg. Response' },
  ];

  return (
    <div
      ref={containerRef}
      className="relative min-h-[100vh] overflow-hidden bg-hero-gradient"
    >
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <FloatingOrb
          className="-left-32 -top-32"
          size="xl"
          color="violet"
          speed="slow"
        />
        <FloatingOrb
          className="-right-20 top-1/4"
          size="lg"
          color="purple"
          speed="medium"
          delay={0.5}
        />
        <FloatingOrb
          className="bottom-1/4 left-1/4"
          size="md"
          color="peach"
          speed="fast"
          delay={1}
        />
        <FloatingOrb
          className="-bottom-20 right-1/3"
          size="lg"
          color="violet"
          speed="slow"
          delay={0.3}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(90deg, #7c3aed 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80" />
      </div>

      {/* Hero Content */}
      <motion.div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20"
        style={{ y, opacity }}
      >
        <motion.div
          className="mx-auto max-w-5xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Trust Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <motion.div
              className="inline-flex items-center gap-3 rounded-full border border-violet-200/50 bg-white/80 px-4 py-2 shadow-lg shadow-violet-500/5 backdrop-blur-sm"
              whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(124, 58, 237, 0.15)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex" role="img" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={`hero-star-${i}`}
                    initial={{ opacity: 0, scale: 0, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.5 + i * 0.1,
                      duration: 0.5,
                      type: 'spring',
                      stiffness: 200,
                    }}
                  >
                    <Star
                      className="size-4 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  </motion.div>
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-900">{t('trust_badge_rating')}</span>
              <span className="h-4 w-px bg-slate-200" />
              <span className="text-sm text-slate-500">{t('trust_badge_count')}</span>
            </motion.div>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            variants={itemVariants}
            className="relative text-balance text-5xl font-bold tracking-tight text-slate-900 md:text-6xl lg:text-7xl"
          >
            {t.rich('title', {
              gradient: chunks => (
                <span className="relative">
                  <span className="text-gradient">{chunks}</span>
                  <motion.span
                    className="absolute -right-6 -top-6"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, duration: 0.5, type: 'spring' }}
                  >
                    <Sparkles className="size-8 text-amber-400" />
                  </motion.span>
                </span>
              ),
            })}
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-8 max-w-2xl text-pretty text-xl text-slate-600 md:text-2xl"
          >
            {t('description')}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              {/* Glow effect */}
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600 opacity-70 blur-lg transition-opacity group-hover:opacity-100" />
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'relative h-14 gap-2 rounded-xl bg-violet-600 px-8 text-lg font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-500/40',
                )}
              >
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
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'h-14 rounded-xl border-2 border-slate-200 bg-white/80 px-8 text-lg font-semibold text-slate-700 backdrop-blur-sm transition-all hover:border-violet-300 hover:bg-white hover:text-violet-700',
                )}
              >
                {t('secondary_button')}
              </Link>
            </motion.div>
          </motion.div>

          {/* Privacy note */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500"
          >
            <Lock className="size-4" />
            <span>{t('privacy_note')}</span>
          </motion.div>

          {/* Disclaimer */}
          <motion.p
            variants={itemVariants}
            className="mt-4 text-xs text-slate-400"
          >
            {t('disclaimer')}
          </motion.p>

          {/* Stats Section */}
          <motion.div
            variants={itemVariants}
            className="mt-16 grid grid-cols-3 gap-8 border-t border-slate-200/50 pt-12"
          >
            {/* Feature callout (no animated number) */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <div className="flex items-center justify-center text-3xl font-bold text-slate-900 md:text-4xl">
                <GraduationCap className="size-8 text-violet-600 md:size-10" />
              </div>
              <div className="mt-1 text-sm text-slate-500">Built by Students, for Students</div>
            </motion.div>

            {/* Animated stats */}
            {animatedStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.15 + index * 0.15, duration: 0.5 }}
              >
                <div className="text-3xl font-bold text-slate-900 md:text-4xl">
                  <AnimatedNumber
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                    duration={2}
                    delay={1.35 + index * 0.15}
                  />
                </div>
                <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <motion.div
            className="flex flex-col items-center gap-2 text-slate-400"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-xs font-medium uppercase tracking-wider">Scroll</span>
            <ChevronDown className="size-5" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Sparkles overlay */}
      <SparkleGroup count={8} />
    </div>
  );
};
