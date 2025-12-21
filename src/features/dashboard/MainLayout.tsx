'use client';

import { useTranslations } from 'next-intl';

import { DashboardHeader } from '@/features/dashboard/DashboardHeader';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('DashboardLayout');

  return (
    <>
      <div className="shadow-md">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-3 py-4">
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
      </div>

      <div className="min-h-[calc(100vh-72px)] bg-muted">
        <div className="mx-auto max-w-screen-xl px-3 pb-16 pt-6">
          {children}
        </div>
      </div>
    </>
  );
}
