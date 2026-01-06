import { getTranslations } from 'next-intl/server';

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
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Submit Your Essay</h1>
          <p className="mt-2 text-muted-foreground">
            Get AI-powered feedback with detailed grades and improvement suggestions
          </p>
        </div>

        {/* Form Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <SubmitForm />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
