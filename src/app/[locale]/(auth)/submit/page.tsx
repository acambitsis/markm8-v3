import { getTranslations } from 'next-intl/server';

import { PageTransition } from '@/components/motion/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { MainLayout } from '@/features/dashboard/MainLayout';
import { SubmitFormV2 } from '@/features/essays/SubmitFormV2';

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Submit Your Essay
          </h1>
          <p className="mt-2 text-muted-foreground">
            Get detailed AI feedback to improve your writing
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <SubmitFormV2 />
          </CardContent>
        </Card>
      </PageTransition>
    </MainLayout>
  );
}
