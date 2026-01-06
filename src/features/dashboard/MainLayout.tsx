'use client';

import { useTranslations } from 'next-intl';

import { DashboardHeader } from '@/features/dashboard/DashboardHeader';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('DashboardLayout');

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 md:px-6">
          <DashboardHeader
            menu={[
              {
                href: '/dashboard',
                label: t('home'),
              },
              {
                href: '/submit',
                label: t('submit'),
              },
              {
                href: '/history',
                label: t('history'),
              },
              {
                href: '/dashboard/user-profile',
                label: t('profile'),
              },
            ]}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-screen-xl px-4 pb-16 pt-8 md:px-6">
        {children}
      </main>
    </div>
  );
}
