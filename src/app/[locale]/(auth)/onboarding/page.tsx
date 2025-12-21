import { getTranslations } from 'next-intl/server';

import { OnboardingForm } from '@/features/onboarding/OnboardingForm';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Onboarding',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function OnboardingPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <OnboardingForm />
    </div>
  );
}
