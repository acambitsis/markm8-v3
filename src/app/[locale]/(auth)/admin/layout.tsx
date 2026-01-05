import { getTranslations } from 'next-intl/server';

import { AdminGuard } from '@/features/admin/AdminGuard';
import { AdminHeader } from '@/features/admin/AdminHeader';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Admin',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function AdminLayout(props: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="shadow-md">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-3 py-4">
          <AdminHeader />
        </div>
      </div>

      <div className="min-h-[calc(100vh-72px)] bg-muted">
        <div className="mx-auto max-w-screen-xl px-3 pb-16 pt-6">
          {props.children}
        </div>
      </div>
    </AdminGuard>
  );
}

export const dynamic = 'force-dynamic';
