import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { AllLocales, getAlternateOgLocales, getOgLocale } from '@/utils/AppConfig';
import { getI18nPath } from '@/utils/Helpers';

import { HomePageContent } from './HomePageContent';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Index',
  });

  // Build locale alternates for hreflang tags (scalable for any number of locales)
  const languages: Record<string, string> = {};
  for (const loc of AllLocales) {
    languages[loc] = getI18nPath('/', loc);
  }

  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: {
      canonical: getI18nPath('/', locale),
      languages,
    },
    openGraph: {
      title: t('meta_title'),
      description: t('meta_description'),
      locale: getOgLocale(locale),
      alternateLocale: getAlternateOgLocales(locale),
    },
  };
}

const IndexPage = async (props: { params: Promise<{ locale: string }> }) => {
  const { locale } = await props.params;
  unstable_setRequestLocale(locale);

  return <HomePageContent />;
};

export default IndexPage;
