import {
  BarChart3,
  Brain,
  Clock,
  CreditCard,
  FileText,
  Lock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { FeatureCard } from '@/features/landing/FeatureCard';
import { Section } from '@/features/landing/Section';

export const FeaturesGrid = () => {
  const t = useTranslations('Features');

  const features = [
    {
      icon: Brain,
      titleKey: 'feature1_title' as const,
      descriptionKey: 'feature1_description' as const,
    },
    {
      icon: BarChart3,
      titleKey: 'feature2_title' as const,
      descriptionKey: 'feature2_description' as const,
    },
    {
      icon: FileText,
      titleKey: 'feature3_title' as const,
      descriptionKey: 'feature3_description' as const,
    },
    {
      icon: Clock,
      titleKey: 'feature4_title' as const,
      descriptionKey: 'feature4_description' as const,
    },
    {
      icon: CreditCard,
      titleKey: 'feature5_title' as const,
      descriptionKey: 'feature5_description' as const,
    },
    {
      icon: Lock,
      titleKey: 'feature6_title' as const,
      descriptionKey: 'feature6_description' as const,
    },
  ];

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map(feature => (
          <FeatureCard
            key={feature.titleKey}
            icon={
              <feature.icon className="size-6 text-violet-600" />
            }
            title={t(feature.titleKey)}
          >
            {t(feature.descriptionKey)}
          </FeatureCard>
        ))}
      </div>
    </Section>
  );
};
