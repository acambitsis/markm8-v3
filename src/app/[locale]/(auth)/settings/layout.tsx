import { getTranslations } from 'next-intl/server';

import { DashboardHeader } from '@/features/dashboard/DashboardHeader';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Settings',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SettingsLayout(props: { children: React.ReactNode }) {
  const t = await getTranslations('DashboardLayout');

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
                href: '/settings',
                label: t('settings'),
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
          {props.children}
        </div>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
