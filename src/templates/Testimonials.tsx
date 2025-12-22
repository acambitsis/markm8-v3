import { useTranslations } from 'next-intl';

import { Background } from '@/components/Background';
import { Section } from '@/features/landing/Section';

const QuoteIcon = () => (
  <svg
    className="size-8 text-purple-500/30"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
  </svg>
);

export const Testimonials = () => {
  const t = useTranslations('Testimonials');

  return (
    <Background>
      <Section
        subtitle={t('section_subtitle')}
        title={t('section_title')}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Testimonial 1 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <QuoteIcon />
            <blockquote className="mt-4 text-pretty text-foreground">
              &ldquo;{t('testimonial1_quote')}&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white">
                SM
              </div>
              <div>
                <div className="font-semibold">{t('testimonial1_author')}</div>
                <div className="text-sm text-muted-foreground">{t('testimonial1_role')}</div>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <QuoteIcon />
            <blockquote className="mt-4 text-pretty text-foreground">
              &ldquo;{t('testimonial2_quote')}&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
                MJ
              </div>
              <div>
                <div className="font-semibold">{t('testimonial2_author')}</div>
                <div className="text-sm text-muted-foreground">{t('testimonial2_role')}</div>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="rounded-xl border border-border bg-card p-6">
            <QuoteIcon />
            <blockquote className="mt-4 text-pretty text-foreground">
              &ldquo;{t('testimonial3_quote')}&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 text-sm font-bold text-white">
                YT
              </div>
              <div>
                <div className="font-semibold">{t('testimonial3_author')}</div>
                <div className="text-sm text-muted-foreground">{t('testimonial3_role')}</div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </Background>
  );
};
