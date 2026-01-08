'use client';

import { useTranslations } from 'next-intl';

import { SampleFeedbackShowcase } from '@/features/landing/SampleFeedbackShowcase';
import { Section } from '@/features/landing/Section';

export const SampleFeedback = () => {
  const t = useTranslations('SampleFeedback');

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
      className="bg-gradient-to-b from-white to-slate-50/50"
    >
      <SampleFeedbackShowcase />
    </Section>
  );
};
