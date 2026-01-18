'use client';

import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { cn } from '@/utils/Helpers';

import { Logo } from './Logo';

export const Navbar = () => {
  const t = useTranslations('Navbar');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  const navLinks = [
    { href: '#how-it-works', label: t('how_it_works') },
    { href: '#features', label: t('features') },
    { href: '#pricing', label: t('pricing') },
    { href: '#faq', label: t('faq') },
  ];

  return (
    <motion.header
      className={cn(
        'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
        isScrolled
          ? 'border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl'
          : 'bg-transparent',
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:h-20">
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
        </motion.div>

        {/* Navigation Links - Desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Link
                href={link.href}
                className="group relative px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                {link.label}
                <span className="absolute inset-x-4 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-violet-500 transition-transform group-hover:scale-x-100" />
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Right Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <Link
              href="/sign-in"
              prefetch={false}
              className="hidden px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline"
            >
              {t('sign_in')}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/sign-up"
              prefetch={false}
              className={cn(
                buttonVariants(),
                'rounded-lg bg-violet-600 px-5 font-semibold shadow-md shadow-violet-500/20 transition-all hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/30',
              )}
            >
              {t('sign_up')}
            </Link>
          </motion.div>

          {/* Mobile menu button */}
          <motion.button
            type="button"
            className="flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className="overflow-hidden border-t border-slate-200 bg-white md:hidden"
        initial={false}
        animate={{
          height: isMobileMenuOpen ? 'auto' : 0,
          opacity: isMobileMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <nav className="flex flex-col gap-1 p-4">
          {navLinks.map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, x: -20 }}
              animate={isMobileMenuOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Link
                href={link.href}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
          <div className="mt-2 border-t border-slate-200 pt-4">
            <Link
              href="/sign-in"
              prefetch={false}
              className="block rounded-lg px-4 py-3 text-center text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('sign_in')}
            </Link>
          </div>
        </nav>
      </motion.div>
    </motion.header>
  );
};
