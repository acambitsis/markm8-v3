'use client';

import { motion, useInView } from 'framer-motion';
import {
  BarChart3,
  Brain,
  Clock,
  CreditCard,
  FileText,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { Section } from '@/features/landing/Section';
import { cn } from '@/utils/Helpers';

type FeatureKey =
  | 'feature1_title'
  | 'feature1_description'
  | 'feature2_title'
  | 'feature2_description'
  | 'feature3_title'
  | 'feature3_description'
  | 'feature4_title'
  | 'feature4_description'
  | 'feature5_title'
  | 'feature5_description'
  | 'feature6_title'
  | 'feature6_description';

type Feature = {
  icon: LucideIcon;
  titleKey: FeatureKey;
  descriptionKey: FeatureKey;
  color: string;
  bgColor: string;
  span?: 'default' | 'wide' | 'tall';
};

export const FeaturesGrid = () => {
  const t = useTranslations('Features');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const features: Feature[] = [
    {
      icon: Brain,
      titleKey: 'feature1_title' as const,
      descriptionKey: 'feature1_description' as const,
      color: 'text-violet-600',
      bgColor: 'bg-violet-100',
      span: 'wide',
    },
    {
      icon: BarChart3,
      titleKey: 'feature2_title' as const,
      descriptionKey: 'feature2_description' as const,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: FileText,
      titleKey: 'feature3_title' as const,
      descriptionKey: 'feature3_description' as const,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      icon: Clock,
      titleKey: 'feature4_title' as const,
      descriptionKey: 'feature4_description' as const,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      icon: CreditCard,
      titleKey: 'feature5_title' as const,
      descriptionKey: 'feature5_description' as const,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: Lock,
      titleKey: 'feature6_title' as const,
      descriptionKey: 'feature6_description' as const,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      span: 'wide',
    },
  ];

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
      className="bg-gradient-to-b from-violet-50/50 to-white"
    >
      <div ref={ref} className="relative">
        {/* Bento grid */}
        <div className="grid auto-rows-[180px] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.titleKey}
              className={cn(
                'group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:border-violet-200 hover:shadow-lg',
                feature.span === 'wide' && 'md:col-span-2',
                feature.span === 'tall' && 'row-span-2',
              )}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ y: -4 }}
            >
              {/* Spotlight effect on hover */}
              <motion.div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: 'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(124, 58, 237, 0.06), transparent 40%)',
                }}
              />

              {/* Gradient border on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-violet-500/20" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col">
                {/* Icon */}
                <motion.div
                  className={cn(
                    'flex size-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
                    feature.bgColor,
                    feature.color,
                  )}
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  <feature.icon className="size-6" />
                </motion.div>

                {/* Title */}
                <h3 className="mt-4 text-lg font-semibold text-slate-900 transition-colors group-hover:text-violet-700">
                  {t(feature.titleKey)}
                </h3>

                {/* Description */}
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {t(feature.descriptionKey)}
                </p>

                {/* Subtle arrow on hover */}
                <motion.div
                  className="absolute bottom-6 right-6 text-violet-500 opacity-0 transition-opacity group-hover:opacity-100"
                  initial={{ x: -10 }}
                  whileHover={{ x: 0 }}
                >
                  <svg
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};
