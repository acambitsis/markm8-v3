'use client';

import { motion, useInView } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { Section } from '@/features/landing/Section';

export const Testimonials = () => {
  const t = useTranslations('Testimonials');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const testimonials = [
    {
      quoteKey: 'testimonial1_quote' as const,
      authorKey: 'testimonial1_author' as const,
      roleKey: 'testimonial1_role' as const,
      rating: 5,
      avatar: '👨‍🎓',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      quoteKey: 'testimonial2_quote' as const,
      authorKey: 'testimonial2_author' as const,
      roleKey: 'testimonial2_role' as const,
      rating: 5,
      avatar: '👩‍💻',
      gradient: 'from-purple-500 to-indigo-600',
    },
    {
      quoteKey: 'testimonial3_quote' as const,
      authorKey: 'testimonial3_author' as const,
      roleKey: 'testimonial3_role' as const,
      rating: 5,
      avatar: '🧑‍🔬',
      gradient: 'from-blue-500 to-cyan-600',
    },
  ];

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <div ref={ref} className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.authorKey}
            className="group relative"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{
              duration: 0.5,
              delay: index * 0.15,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            {/* Card */}
            <motion.div
              className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-violet-200 hover:shadow-xl"
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {/* Gradient accent line */}
              <motion.div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${testimonial.gradient}`}
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ delay: index * 0.15 + 0.3, duration: 0.5 }}
                style={{ transformOrigin: 'left' }}
              />

              {/* Quote icon */}
              <div className="absolute right-4 top-4 text-slate-100 transition-colors group-hover:text-violet-100">
                <Quote className="size-12" />
              </div>

              {/* Stars */}
              <div className="relative flex gap-0.5" role="img" aria-label={`${testimonial.rating} out of 5 stars`}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <motion.div
                    key={`star-${testimonial.authorKey}-${i}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                    transition={{
                      delay: index * 0.15 + 0.2 + i * 0.05,
                      duration: 0.3,
                      type: 'spring',
                      stiffness: 300,
                    }}
                  >
                    <Star
                      className="size-5 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Quote */}
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                &ldquo;
                {t(testimonial.quoteKey)}
                &rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
                {/* Avatar */}
                <motion.div
                  className={`flex size-12 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.gradient} text-2xl shadow-md`}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  {testimonial.avatar}
                </motion.div>

                <div>
                  <p className="font-semibold text-slate-900">{t(testimonial.authorKey)}</p>
                  <p className="text-sm text-slate-500">{t(testimonial.roleKey)}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};
