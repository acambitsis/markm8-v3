// Slack notification helpers
// Sends notifications to Slack webhooks for business events
// No-op in dev when env vars are not set

export type SlackChannel = 'activity' | 'signups';

const WEBHOOK_ENV_VARS: Record<SlackChannel, string> = {
  activity: 'SLACK_WEBHOOK_ACTIVITY',
  signups: 'SLACK_WEBHOOK_SIGNUPS',
};

/**
 * Send a notification to a Slack channel
 * Silently skips if the webhook URL is not configured (dev environment)
 *
 * @param channel - Which Slack channel to send to
 * @param message - The message text to send
 */
export async function notifySlack(
  channel: SlackChannel,
  message: string,
): Promise<void> {
  const envVar = WEBHOOK_ENV_VARS[channel];
  const webhookUrl = process.env[envVar];

  if (!webhookUrl) {
    // No-op in dev - env var not set
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });

    if (!response.ok) {
      // Log but don't throw - notifications shouldn't break core functionality
      console.error(`Slack notification failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    // Log but don't throw - notifications shouldn't break core functionality
    console.error('Slack notification error:', error);
  }
}
