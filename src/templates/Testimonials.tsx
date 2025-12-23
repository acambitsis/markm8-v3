'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Section } from '@/features/landing/Section';

export const Testimonials = () => {
  const t = useTranslations('Testimonials');

  const testimonials = [
    {
      quoteKey: 'testimonial1_quote' as const,
      authorKey: 'testimonial1_author' as const,
      roleKey: 'testimonial1_role' as const,
      rating: 5,
    },
    {
      quoteKey: 'testimonial2_quote' as const,
      authorKey: 'testimonial2_author' as const,
      roleKey: 'testimonial2_role' as const,
      rating: 5,
    },
    {
      quoteKey: 'testimonial3_quote' as const,
      authorKey: 'testimonial3_author' as const,
      roleKey: 'testimonial3_role' as const,
      rating: 5,
    },
  ];

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map(testimonial => (
          <div
            key={testimonial.authorKey}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Stars */}
            <div className="flex gap-0.5" role="img" aria-label={`${testimonial.rating} out of 5 stars`}>
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="size-4 fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
              ))}
            </div>

            {/* Quote */}
            <p className="mt-4 text-slate-600">
              &ldquo;
              {t(testimonial.quoteKey)}
              &rdquo;
            </p>

            {/* Author */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="font-semibold text-slate-900">{t(testimonial.authorKey)}</p>
              <p className="text-sm text-slate-500">{t(testimonial.roleKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};
