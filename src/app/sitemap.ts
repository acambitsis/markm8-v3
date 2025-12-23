import type { MetadataRoute } from 'next';

import { AllLocales, AppConfig } from '@/utils/AppConfig';
import { getBaseUrl } from '@/utils/Helpers';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  // Generate locale alternates for hreflang
  const localeAlternates = AllLocales.reduce(
    (acc, locale) => {
      acc[locale] = `${baseUrl}/${locale}`;
      return acc;
    },
    {} as Record<string, string>,
  );

  return [
    // Landing page - all locales
    ...AllLocales.map(locale => ({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
      alternates: {
        languages: localeAlternates,
      },
    })),
    // Default route
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          ...localeAlternates,
          'x-default': `${baseUrl}/${AppConfig.defaultLocale}`,
        },
      },
    },
  ];
}
