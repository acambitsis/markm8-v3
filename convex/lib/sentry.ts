// Sentry error reporting via HTTP envelope API
// Sends error reports directly to Sentry from Convex functions
// No-op when SENTRY_DSN is not configured
// Never throws - errors are logged to console

type SentryEventOptions = {
  error: Error | string;
  functionName: string;
  functionType: 'action' | 'mutation' | 'query' | 'http_action';
  userId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

type ParsedDsn = {
  publicKey: string;
  host: string;
  projectId: string;
};

/**
 * Parse a Sentry DSN into its components
 * Format: https://{public_key}@{host}/{project_id}
 */
function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const host = url.host;
    const projectId = url.pathname.slice(1); // Remove leading /

    if (!publicKey || !host || !projectId) {
      return null;
    }

    return { publicKey, host, projectId };
  } catch {
    return null;
  }
}

/**
 * Parse a single stack trace line.
 * Handles: "    at functionName (file:line:col)" or "    at file:line:col"
 */
function parseStackLine(line: string): { function: string; filename?: string; lineno?: number; colno?: number } | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('at ')) {
    return null;
  }

  const content = trimmed.slice(3); // Remove "at "

  // Try to match "functionName (file:line:col)"
  const parenIndex = content.lastIndexOf('(');
  if (parenIndex !== -1 && content.endsWith(')')) {
    const funcName = content.slice(0, parenIndex).trim();
    const location = content.slice(parenIndex + 1, -1); // Remove parens
    const parts = location.split(':');
    if (parts.length >= 3) {
      const colno = Number.parseInt(parts.pop()!, 10);
      const lineno = Number.parseInt(parts.pop()!, 10);
      const filename = parts.join(':'); // Handle Windows paths with colons
      return { function: funcName || '<anonymous>', filename, lineno, colno };
    }
  }

  // Try to match "file:line:col" directly
  const parts = content.split(':');
  if (parts.length >= 3) {
    const colno = Number.parseInt(parts.pop()!, 10);
    const lineno = Number.parseInt(parts.pop()!, 10);
    const filename = parts.join(':');
    return { function: '<anonymous>', filename, lineno, colno };
  }

  return { function: trimmed };
}

/**
 * Build the Sentry envelope format
 * Format: 3 newline-separated JSON objects (header, item header, payload)
 */
function buildEnvelope(
  parsedDsn: ParsedDsn,
  options: SentryEventOptions,
): string {
  const eventId = crypto.randomUUID().replace(/-/g, '');
  const timestamp = Date.now() / 1000;

  // Envelope header
  const envelopeHeader = JSON.stringify({
    event_id: eventId,
    sent_at: new Date().toISOString(),
    dsn: `https://${parsedDsn.publicKey}@${parsedDsn.host}/${parsedDsn.projectId}`,
  });

  // Item header
  const itemHeader = JSON.stringify({
    type: 'event',
  });

  // Build stack trace if available
  const error = typeof options.error === 'string'
    ? new Error(options.error)
    : options.error;

  const stackFrames = error.stack
    ?.split('\n')
    .slice(1)
    .map(parseStackLine)
    .filter((frame): frame is NonNullable<typeof frame> => frame !== null)
    ?? [];

  // Event payload
  const eventPayload = JSON.stringify({
    event_id: eventId,
    timestamp,
    platform: 'node',
    level: 'error',
    server_name: 'convex',
    // Use explicit SENTRY_ENVIRONMENT env var, default to 'production' for safety
    environment: process.env.SENTRY_ENVIRONMENT ?? 'production',
    release: process.env.CONVEX_DEPLOY_KEY ? 'convex-function' : undefined,
    exception: {
      values: [
        {
          type: error.name || 'Error',
          value: error.message,
          stacktrace: stackFrames.length > 0 ? { frames: stackFrames.reverse() } : undefined,
        },
      ],
    },
    tags: {
      function_name: options.functionName,
      function_type: options.functionType,
      runtime: 'convex',
      ...options.tags,
    },
    user: options.userId ? { id: options.userId } : undefined,
    extra: options.extra,
    contexts: {
      runtime: {
        name: 'Convex',
        version: 'serverless',
      },
    },
  });

  return `${envelopeHeader}\n${itemHeader}\n${eventPayload}`;
}

/**
 * Report an error to Sentry via HTTP envelope API.
 * Silently skips if SENTRY_DSN is not configured.
 * Never throws - errors are logged to console.
 */
export async function reportToSentry(options: SentryEventOptions): Promise<void> {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    return;
  }

  const parsedDsn = parseDsn(dsn);
  if (!parsedDsn) {
    console.error('[Sentry] Invalid DSN format');
    return;
  }

  const envelope = buildEnvelope(parsedDsn, options);
  const endpoint = `https://${parsedDsn.host}/api/${parsedDsn.projectId}/envelope/`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=convex-sentry/1.0.0, sentry_key=${parsedDsn.publicKey}`,
      },
      body: envelope,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[Sentry] Failed to send event: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Sentry] Request timed out');
    } else {
      console.error('[Sentry] Failed to send event:', error);
    }
  }
}
