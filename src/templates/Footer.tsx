'use client';

import { motion, useInView } from 'framer-motion';
import { Github, Heart, Twitter } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { AppConfig } from '@/utils/AppConfig';

import { Logo } from './Logo';

export const Footer = () => {
  const t = useTranslations('Footer');
  const currentYear = new Date().getFullYear();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const footerLinks = [
    { href: '#how-it-works', label: t('how_it_works') },
    { href: '#features', label: t('features') },
    { href: '#pricing', label: t('pricing') },
    { href: '#faq', label: t('faq') },
  ];

  const legalLinks = [
    { href: '/terms', label: t('terms') },
    { href: '/privacy', label: t('privacy') },
  ];

  return (
    <footer
      ref={ref}
      className="relative overflow-hidden border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white"
    >
      {/* Decorative gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 size-80 rounded-full bg-violet-100/50 blur-3xl" />
        <div className="absolute -right-40 bottom-0 size-80 rounded-full bg-amber-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              AI-powered essay grading that helps students improve their writing with instant, detailed feedback.
            </p>
            <div className="mt-6 flex gap-4">
              <motion.a
                href="https://twitter.com/markm8app"
                className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-violet-100 hover:text-violet-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Twitter"
              >
                <Twitter className="size-5" />
              </motion.a>
              <motion.a
                href="https://github.com/markm8"
                className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-violet-100 hover:text-violet-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="GitHub"
              >
                <Github className="size-5" />
              </motion.a>
            </div>
          </motion.div>

          {/* Navigation column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Navigation
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-violet-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              {legalLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-violet-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-sm text-slate-500">
            &copy;
            {' '}
            {currentYear}
            {' '}
            {AppConfig.name}
            .
            {' '}
            {t('all_rights_reserved')}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            Made with
            {' '}
            <Heart className="size-4 fill-red-500 text-red-500" />
            {' '}
            for students everywhere
          </p>
        </motion.div>
      </div>
    </footer>
  );
};
