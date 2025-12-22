import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Section } from '@/features/landing/Section';
import { AppConfig } from '@/utils/AppConfig';

import { Logo } from './Logo';

export const Footer = () => {
  const t = useTranslations('Footer');

  return (
    <Section className="pb-8 pt-0">
      <div className="border-t border-border pt-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Logo />
            <p className="text-sm text-muted-foreground">{t('designed_by')}</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground">
              {t('features')}
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground">
              {t('pricing')}
            </a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground">
              {t('faq')}
            </a>
            <Link href="/sign-up" className="text-muted-foreground hover:text-foreground">
              {t('help_center')}
            </Link>
          </nav>

          {/* Legal */}
          <div className="flex gap-6 text-sm">
            <Link href="/terms" className="text-muted-foreground hover:text-foreground">
              {t('terms_of_service')}
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
              {t('privacy_policy')}
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {AppConfig.name}. All rights reserved.
        </div>
      </div>
    </Section>
  );
};
