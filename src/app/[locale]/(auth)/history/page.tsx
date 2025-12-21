import { getTranslations } from 'next-intl/server';

import { TitleBar } from '@/components/TitleBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/features/dashboard/MainLayout';
import { EssayHistoryTable } from '@/features/essays/EssayHistoryTable';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'History',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function HistoryPage() {
  return (
    <MainLayout>
      <TitleBar
        title="Essay History"
        description="View all your past essay submissions and grades"
      />

      <Card>
        <CardHeader>
          <CardTitle>Your Essays</CardTitle>
          <CardDescription>
            Click on any essay to view its grade and feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EssayHistoryTable />
        </CardContent>
      </Card>
    </MainLayout>
  );
}
