import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { AppConfig } from '@/utils/AppConfig';

import { Logo } from './Logo';

export const Footer = () => {
  const t = useTranslations('Footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center gap-4 md:items-start">
            <Logo />
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
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm">
            <Link
              href="#how-it-works"
              className="text-slate-500 transition-colors hover:text-slate-900"
            >
              {t('how_it_works')}
            </Link>
            <Link
              href="#features"
              className="text-slate-500 transition-colors hover:text-slate-900"
            >
              {t('features')}
            </Link>
            <Link
              href="#pricing"
              className="text-slate-500 transition-colors hover:text-slate-900"
            >
              {t('pricing')}
            </Link>
            <Link
              href="#faq"
              className="text-slate-500 transition-colors hover:text-slate-900"
            >
              {t('faq')}
            </Link>
          </div>

          {/* Legal */}
          <div className="flex gap-6 text-sm">
            <Link
              href="/terms"
              className="text-slate-500 transition-colors hover:text-slate-900"
            >
              {t('terms')}
            </Link>
            <Link
              href="/privacy"
              className="text-slate-500 transition-colors hover:text-slate-900"
            >
              {t('privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
