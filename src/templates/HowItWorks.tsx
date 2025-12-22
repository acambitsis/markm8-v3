import { useTranslations } from 'next-intl';

import { Section } from '@/features/landing/Section';

export const HowItWorks = () => {
  const t = useTranslations('HowItWorks');

  return (
    <Section
      id="how-it-works"
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Step 1 */}
        <div className="relative flex flex-col items-center text-center">
          {/* Step number */}
          <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-2xl font-bold text-white">
            {t('step1_number')}
          </div>

          {/* Connector line (hidden on mobile) */}
          <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-0.5 w-[calc(100%-4rem)] bg-gradient-to-r from-purple-500 to-pink-500/20 md:block" />

          <h3 className="mt-6 text-xl font-bold">{t('step1_title')}</h3>
          <p className="mt-3 text-muted-foreground">{t('step1_description')}</p>

          {/* Visual representation */}
          <div className="mt-6 w-full rounded-lg border border-border bg-card p-4">
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-4/5 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/5 rounded bg-muted" />
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="relative flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-2xl font-bold text-white">
            {t('step2_number')}
          </div>

          {/* Connector line (hidden on mobile) */}
          <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-0.5 w-[calc(100%-4rem)] bg-gradient-to-r from-purple-500/20 to-pink-500 md:block" />

          <h3 className="mt-6 text-xl font-bold">{t('step2_title')}</h3>
          <p className="mt-3 text-muted-foreground">{t('step2_description')}</p>

          {/* Visual representation - AI processing */}
          <div className="mt-6 w-full rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/20">
                <div className="size-4 rounded-full bg-indigo-500" />
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-purple-500/20">
                <div className="size-4 rounded-full bg-purple-500" />
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-pink-500/20">
                <div className="size-4 rounded-full bg-pink-500" />
              </div>
            </div>
            <div className="mt-3 text-sm font-medium text-muted-foreground">3 AI Models</div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="relative flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-2xl font-bold text-white">
            {t('step3_number')}
          </div>

          <h3 className="mt-6 text-xl font-bold">{t('step3_title')}</h3>
          <p className="mt-3 text-muted-foreground">{t('step3_description')}</p>

          {/* Visual representation - Grade result */}
          <div className="mt-6 w-full rounded-lg border border-border bg-card p-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              B+ to A-
            </div>
            <div className="mt-2 text-sm font-medium text-muted-foreground">Grade Range</div>
          </div>
        </div>
      </div>
    </Section>
  );
};
