import * as Sentry from '@sentry/nextjs';

const isDev = process.env.NODE_ENV === 'development';

const sharedConfig: Sentry.NodeOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  spotlight: isDev,
  tracesSampleRate: isDev ? 1.0 : 0.1,
  debug: false,

  // Filter out noise before sending to Sentry
  beforeSend(event, hint) {
    const error = hint.originalException;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Filter out 404 errors - expected from bots/crawlers hitting non-existent routes
    if (errorMessage.includes('NEXT_HTTP_ERROR_FALLBACK;404')) {
      return null; // Don't send to Sentry
    }

    return event;
  },
};

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(sharedConfig);
  }
}
