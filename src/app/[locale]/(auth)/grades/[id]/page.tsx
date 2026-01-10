import { getTranslations } from 'next-intl/server';

import { MainLayout } from '@/features/dashboard/MainLayout';
import { GradeStatusDisplay } from '@/features/grading/GradeStatusDisplay';

import type { Id } from '../../../../../../convex/_generated/dataModel';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata(props: Props) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Grades',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function GradePage({ params }: Props) {
  const { id } = await params;

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Grading Review
        </h1>
        <p className="mt-2 text-muted-foreground">
          Detailed feedback and analysis of your essay
        </p>
      </div>

      <GradeStatusDisplay gradeId={id as Id<'grades'>} />
    </MainLayout>
  );
}
