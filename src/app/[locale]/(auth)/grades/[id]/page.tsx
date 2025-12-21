import { getTranslations } from 'next-intl/server';

import { MainLayout } from '@/features/dashboard/MainLayout';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { GradeStatusDisplay } from '@/features/grading/GradeStatusDisplay';

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
      <TitleBar
        title="Grade Results"
        description="View your essay grading results and feedback"
      />

      <GradeStatusDisplay gradeId={id} />
    </MainLayout>
  );
}
