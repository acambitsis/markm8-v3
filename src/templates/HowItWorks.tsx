'use client';

import { motion, useInView } from 'framer-motion';
import { CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { Section } from '@/features/landing/Section';

export const HowItWorks = () => {
  const t = useTranslations('HowItWorks');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const steps = [
    {
      number: '1',
      icon: FileText,
      titleKey: 'step1_title' as const,
      descriptionKey: 'step1_description' as const,
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
    {
      number: '2',
      icon: Sparkles,
      titleKey: 'step2_title' as const,
      descriptionKey: 'step2_description' as const,
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      number: '3',
      icon: CheckCircle2,
      titleKey: 'step3_title' as const,
      descriptionKey: 'step3_description' as const,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <div ref={ref} className="relative">
        {/* Animated connector line - desktop */}
        <div className="absolute left-0 right-0 top-[60px] hidden lg:block">
          <svg className="h-4 w-full" viewBox="0 0 1000 16" preserveAspectRatio="none">
            <motion.path
              d="M0,8 Q250,8 333,8 Q416,8 500,8 Q583,8 666,8 Q750,8 1000,8"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray="8 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.5 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="relative"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{
                duration: 0.6,
                delay: index * 0.2,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              {/* Step card */}
              <motion.div
                className="group relative flex flex-col items-center text-center"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step number with glow */}
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-full blur-xl"
                    style={{
                      background: `linear-gradient(135deg, ${step.color.includes('violet') ? '#8b5cf6' : step.color.includes('purple') ? '#7c3aed' : '#10b981'} 0%, transparent 70%)`,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 0.3, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.2 + 0.3, duration: 0.5 }}
                  />
                  <motion.div
                    className={`relative z-10 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-3xl font-bold text-white shadow-lg`}
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    {step.number}
                  </motion.div>
                </div>

                {/* Arrow - mobile */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="my-6 lg:hidden"
                    initial={{ opacity: 0, y: -10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.2 + 0.4, duration: 0.3 }}
                  >
                    <svg
                      className="size-8 text-slate-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </motion.div>
                )}

                {/* Icon */}
                <motion.div
                  className={`mt-6 flex size-14 items-center justify-center rounded-xl ${step.bgColor} transition-transform group-hover:scale-110`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <step.icon className={`size-7 ${step.iconColor}`} />
                </motion.div>

                {/* Title */}
                <h3 className="mt-5 text-xl font-semibold text-slate-900">
                  {t(step.titleKey)}
                </h3>

                {/* Description */}
                <p className="mt-3 max-w-xs text-slate-600">
                  {t(step.descriptionKey)}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};
