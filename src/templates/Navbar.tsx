'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { cn } from '@/utils/Helpers';

import { Logo } from './Logo';

export const Navbar = () => {
  const t = useTranslations('Navbar');

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Navigation Links - Desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            {t('how_it_works')}
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            {t('features')}
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            {t('pricing')}
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            {t('faq')}
          </Link>
        </nav>

        {/* Right Menu */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />

          <Link
            href="/sign-in"
            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline"
          >
            {t('sign_in')}
          </Link>

          <Link
            href="/sign-up"
            className={cn(
              buttonVariants(),
              'bg-violet-500 hover:bg-violet-600',
            )}
          >
            {t('sign_up')}
          </Link>
        </div>
      </div>
    </header>
  );
};
