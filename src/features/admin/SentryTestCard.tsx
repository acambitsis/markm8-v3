'use client';

import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function SentryTestCard() {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const handleTestError = async () => {
    setIsSending(true);
    setResult(null);

    try {
      const timestamp = new Date().toISOString();
      const error = new Error(`[TEST] Admin-triggered test error at ${timestamp}`);

      // Capture the error in Sentry
      Sentry.captureException(error, {
        tags: {
          test: 'true',
          triggered_by: 'admin',
        },
        level: 'error',
      });

      // Flush to ensure it's sent
      await Sentry.flush(2000);

      setResult('success');
    } catch {
      setResult('error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Send a test error to verify Sentry is receiving events. Check your Sentry dashboard after clicking.
      </p>

      <div className="flex items-center gap-4">
        <Button
          onClick={handleTestError}
          disabled={isSending}
          variant="outline"
          className="gap-2"
        >
          {isSending
            ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              )
            : (
                <>
                  <AlertTriangle className="size-4" />
                  Send Test Error
                </>
              )}
        </Button>

        {result === 'success' && (
          <span className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="size-4" />
            Test error sent - check Sentry dashboard
          </span>
        )}

        {result === 'error' && (
          <span className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" />
            Failed to send - is Sentry DSN configured?
          </span>
        )}
      </div>

      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong>
          {' '}
          Test errors are tagged with
          {' '}
          <code className="rounded bg-muted px-1 py-0.5">test:true</code>
          {' '}
          so you can filter them in Sentry.
        </p>
      </div>
    </div>
  );
}
