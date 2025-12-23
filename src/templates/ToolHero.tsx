import { ArrowRight, Lock, Star } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { cn } from '@/utils/Helpers';

export const ToolHero = () => {
  const t = useTranslations('Hero');

  return (
    <div className="px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-4xl">
        {/* Trust Badge */}
        <div className="mb-6 flex items-center justify-center gap-1.5">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="size-4 fill-amber-400 text-amber-400"
              />
            ))}
          </div>
          <span className="text-sm font-medium text-slate-900">{t('trust_badge_rating')}</span>
          <span className="text-sm text-slate-500">
            {t('trust_badge_count')}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-balance text-center text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
          {t.rich('title', {
            gradient: chunks => (
              <span className="text-gradient">{chunks}</span>
            ),
          })}
        </h1>

        {/* Description */}
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-center text-lg text-slate-600 md:text-xl">
          {t('description')}
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'bg-violet-500 hover:bg-violet-600 hover:shadow-purple',
            )}
          >
            {t('primary_button')}
            <ArrowRight className="ml-2 size-4" />
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
          >
            {t('secondary_button')}
          </Link>
        </div>

        {/* Privacy note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Lock className="size-4" />
          <span>{t('privacy_note')}</span>
        </div>
      </div>
    </div>
  );
};
