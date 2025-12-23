'use client';

import { ArrowRight, Brain, Check, FileText, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { cn } from '@/utils/Helpers';

export const Pricing = () => {
  const t = useTranslations('Pricing');

  const includedFeatures = [
    { icon: Brain, textKey: 'included_ai_models' as const },
    { icon: FileText, textKey: 'included_breakdown' as const },
    { icon: MessageSquare, textKey: 'included_feedback' as const },
    { icon: Check, textKey: 'included_rubric' as const },
  ];

  const trustBadges = [
    { textKey: 'trust_no_expiry' as const },
    { textKey: 'trust_secure' as const },
    { textKey: 'trust_fast' as const },
  ];

  return (
    <div id="pricing">
      <Section
        subtitle={t('section_subtitle')}
        title={t('section_title')}
        description={t('section_description')}
      >
        {/* Single pricing card */}
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border-2 border-violet-200 bg-white p-8 shadow-lg">
            {/* Price */}
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">{t('price_label')}</p>
              <div className="mt-2 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold tracking-tight text-slate-900">{t('price_value')}</span>
                <span className="text-lg text-slate-400">{t('price_cents')}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {t('price_note')}
              </p>
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-slate-200" />

            {/* What's included */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900">{t('included_title')}</p>
              {includedFeatures.map(feature => (
                <div key={feature.textKey} className="flex items-center gap-3">
                  <div className="flex size-5 items-center justify-center rounded-full bg-violet-100">
                    <feature.icon className="size-3 text-violet-600" />
                  </div>
                  <span className="text-sm text-slate-600">{t(feature.textKey)}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/sign-up"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'mt-8 w-full bg-violet-500 hover:bg-violet-600',
              )}
            >
              {t('cta_button')}
              <ArrowRight className="ml-2 size-4" />
            </Link>

            <p className="mt-3 text-center text-xs text-slate-500">
              {t('cta_note')}
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-600">
          {trustBadges.map(badge => (
            <div key={badge.textKey} className="flex items-center gap-2">
              <Check className="size-4 text-green-500" />
              <span>{t(badge.textKey)}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};
