import * as Sentry from '@sentry/nextjs';

const isDev = process.env.NODE_ENV === 'development';

const sharedConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  spotlight: isDev,
  tracesSampleRate: isDev ? 1.0 : 0.1,
  debug: false,
};

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(sharedConfig);
  }
}
