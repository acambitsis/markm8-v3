'use client';

import { ArrowRight, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Section } from '@/features/landing/Section';

export const HowItWorks = () => {
  const t = useTranslations('HowItWorks');

  const steps = [
    {
      number: '1',
      icon: FileText,
      titleKey: 'step1_title' as const,
      descriptionKey: 'step1_description' as const,
    },
    {
      number: '2',
      icon: Sparkles,
      titleKey: 'step2_title' as const,
      descriptionKey: 'step2_description' as const,
    },
    {
      number: '3',
      icon: CheckCircle2,
      titleKey: 'step3_title' as const,
      descriptionKey: 'step3_description' as const,
    },
  ];

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <div className="relative">
        {/* Connector line - desktop only */}
        <div className="absolute left-0 right-0 top-16 hidden h-0.5 bg-gradient-to-r from-transparent via-violet-200 to-transparent lg:block" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {/* Step number circle */}
              <div className="relative z-10 flex size-16 items-center justify-center rounded-full bg-violet-500 text-2xl font-bold text-white shadow-purple">
                {step.number}
              </div>

              {/* Arrow between steps - mobile */}
              {index < steps.length - 1 && (
                <div className="my-4 flex items-center justify-center md:hidden">
                  <ArrowRight className="size-6 rotate-90 text-violet-300" />
                </div>
              )}

              {/* Icon */}
              <div className="mt-6 flex size-12 items-center justify-center rounded-xl bg-violet-100">
                <step.icon className="size-6 text-violet-600" />
              </div>

              {/* Title */}
              <h3 className="mt-4 text-xl font-semibold text-slate-900">{t(step.titleKey)}</h3>

              {/* Description */}
              <p className="mt-2 text-slate-600">{t(step.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};
