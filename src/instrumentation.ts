import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Node.js Sentry configuration
    Sentry.init({
      // Sentry DSN
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Enable Spotlight in development
      spotlight: process.env.NODE_ENV === 'development',

      // 100% in dev for debugging, 10% in prod for cost control
      tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge Sentry configuration
    Sentry.init({
      // Sentry DSN
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Enable Spotlight in development
      spotlight: process.env.NODE_ENV === 'development',

      // 100% in dev for debugging, 10% in prod for cost control
      tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,
    });
  }
}
