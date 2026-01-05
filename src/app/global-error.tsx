'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect, useState } from 'react';

import { AllLocales, AppConfig } from '@/utils/AppConfig';

/**
 * Extract locale from URL path (e.g., /fr/dashboard -> 'fr')
 * Falls back to default locale if not found or invalid
 */
function getLocaleFromPath(): string {
  if (typeof window === 'undefined') {
    return AppConfig.defaultLocale;
  }

  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];

  if (firstSegment && AllLocales.includes(firstSegment)) {
    return firstSegment;
  }

  return AppConfig.defaultLocale;
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState(AppConfig.defaultLocale);

  useEffect(() => {
    Sentry.captureException(error);
    // Extract locale from URL on client side
    setLocale(getLocaleFromPath());
  }, [error]);

  return (
    <html lang={locale}>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
        <button
          type="button"
          onClick={reset}
          style={{
            display: 'block',
            margin: '20px auto',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 500,
            color: '#ffffff',
            backgroundColor: '#0070f3',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
