import { useTranslations } from 'next-intl';

import { Background } from '@/components/Background';
import { FeatureCard } from '@/features/landing/FeatureCard';
import { Section } from '@/features/landing/Section';

// Icon components for each feature
const TripleAIIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M0 0h24v24H0z" stroke="none" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="12" r="3" />
    <circle cx="12" cy="6" r="3" />
    <path d="M6 15v3m12-3v3M9 6.8l3-2.3M15 6.8l-3-2.3" />
  </svg>
);

const InstantIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M0 0h24v24H0z" stroke="none" />
    <path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />
  </svg>
);

const RubricIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M0 0h24v24H0z" stroke="none" />
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="2" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const BreakdownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M0 0h24v24H0z" stroke="none" />
    <path d="M3 12h4l3 8l4-16l3 8h4" />
  </svg>
);

const RangeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M0 0h24v24H0z" stroke="none" />
    <path d="M12 17.75l-6.172 3.245l1.179-6.873l-5-4.867l6.9-1l3.086-6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
  </svg>
);

const RevisionIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M0 0h24v24H0z" stroke="none" />
    <path d="M20 11A8.1 8.1 0 004.5 9M4 5v4h4" />
    <path d="M4 13a8.1 8.1 0 0015.5 2m.5 4v-4h-4" />
  </svg>
);

export const Features = () => {
  const t = useTranslations('Features');

  return (
    <Background>
      <Section
        id="features"
        subtitle={t('section_subtitle')}
        title={t('section_title')}
        description={t('section_description')}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<TripleAIIcon />}
            title={t('feature1_title')}
          >
            {t('feature1_description')}
          </FeatureCard>

          <FeatureCard
            icon={<InstantIcon />}
            title={t('feature2_title')}
          >
            {t('feature2_description')}
          </FeatureCard>

          <FeatureCard
            icon={<RubricIcon />}
            title={t('feature3_title')}
          >
            {t('feature3_description')}
          </FeatureCard>

          <FeatureCard
            icon={<BreakdownIcon />}
            title={t('feature4_title')}
          >
            {t('feature4_description')}
          </FeatureCard>

          <FeatureCard
            icon={<RangeIcon />}
            title={t('feature5_title')}
          >
            {t('feature5_description')}
          </FeatureCard>

          <FeatureCard
            icon={<RevisionIcon />}
            title={t('feature6_title')}
          >
            {t('feature6_description')}
          </FeatureCard>
        </div>
      </Section>
    </Background>
  );
};
