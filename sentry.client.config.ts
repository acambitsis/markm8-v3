// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import * as Spotlight from '@spotlightjs/spotlight';

// Authenticated routes that should have Sentry Replay enabled
const AUTHENTICATED_ROUTE_PREFIXES = [
  '/dashboard',
  '/submit',
  '/grades',
  '/history',
  '/settings',
  '/admin',
];

// Check if the current path is an authenticated route
function isAuthenticatedRoute(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const pathname = window.location.pathname;
  // Handle locale prefix (e.g., /en/dashboard, /fr/dashboard)
  // Remove locale prefix if present (2-letter code after first slash)
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');

  return AUTHENTICATED_ROUTE_PREFIXES.some(prefix => pathWithoutLocale.startsWith(prefix));
}

const shouldEnableReplay = isAuthenticatedRoute();

Sentry.init({
  // Sentry DSN
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 100% in dev for debugging, 10% in prod for cost control
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Only set replay sample rates if on authenticated routes
  replaysOnErrorSampleRate: shouldEnableReplay ? 1.0 : 0,
  replaysSessionSampleRate: shouldEnableReplay ? 0.1 : 0,

  // Only include Replay integration on authenticated routes to reduce bundle size on landing page
  integrations: shouldEnableReplay
    ? [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ]
    : [],
});

if (process.env.NODE_ENV === 'development') {
  Spotlight.init();
}
