import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/motion/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { MainLayout } from '@/features/dashboard/MainLayout';
import { SubmitForm } from '@/features/essays/SubmitForm';
import { SubmitPageHeader } from '@/features/essays/SubmitPageHeader';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Submit',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function SubmitPage() {
  return (
    <MainLayout>
      <PageTransition>
        {/* Header with cost transparency */}
        <SubmitPageHeader />

        {/* Form Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <SubmitForm />
          </CardContent>
        </Card>
      </PageTransition>
    </MainLayout>
  );
}
