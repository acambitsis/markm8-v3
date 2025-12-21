import { getTranslations } from 'next-intl/server';

import { TitleBar } from '@/components/TitleBar';
import { Card, CardContent } from '@/components/ui/card';
import { MainLayout } from '@/features/dashboard/MainLayout';
import { SubmitForm } from '@/features/essays/SubmitForm';

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
      <TitleBar
        title="Submit Essay"
        description="Get AI-powered feedback on your essay"
      />

      <Card>
        <CardContent className="pt-6">
          <SubmitForm />
        </CardContent>
      </Card>
    </MainLayout>
  );
}
