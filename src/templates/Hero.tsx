import { useTranslations } from 'next-intl';

import { badgeVariants } from '@/components/ui/badgeVariants';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';

export const Hero = () => {
  const t = useTranslations('Hero');
  const tStats = useTranslations('Stats');

  return (
    <Section className="py-24 lg:py-32">
      {/* Badge */}
      <div className="text-center">
        <span className={badgeVariants({ variant: 'secondary', className: 'px-4 py-1.5' })}>
          {t('badge')}
        </span>
      </div>

      {/* Main Title */}
      <h1 className="mx-auto mt-6 max-w-4xl text-balance text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        {t.rich('title', {
          important: chunks => (
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {chunks}
            </span>
          ),
        })}
      </h1>

      {/* Description */}
      <p className="mx-auto mt-6 max-w-2xl text-pretty text-center text-lg text-muted-foreground lg:text-xl">
        {t('description')}
      </p>

      {/* CTA Buttons */}
      <div className="mt-10 flex justify-center gap-x-4 gap-y-3 max-sm:flex-col max-sm:items-center">
        <a
          className={buttonVariants({ size: 'lg', className: 'px-8 text-base' })}
          href="/sign-up"
        >
          {t('primary_button')}
        </a>

        <a
          className={buttonVariants({ variant: 'outline', size: 'lg', className: 'px-8 text-base' })}
          href="#how-it-works"
        >
          {t('secondary_button')}
        </a>
      </div>

      {/* Stats Row */}
      <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-8 border-t border-border pt-10 sm:grid-cols-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">{tStats('stat1_value')}</div>
          <div className="mt-1 text-sm text-muted-foreground">{tStats('stat1_label')}</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">{tStats('stat2_value')}</div>
          <div className="mt-1 text-sm text-muted-foreground">{tStats('stat2_label')}</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">{tStats('stat3_value')}</div>
          <div className="mt-1 text-sm text-muted-foreground">{tStats('stat3_label')}</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">{tStats('stat4_value')}</div>
          <div className="mt-1 text-sm text-muted-foreground">{tStats('stat4_label')}</div>
        </div>
      </div>
    </Section>
  );
};
