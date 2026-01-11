// Slack notification helper
// Sends notifications to Slack webhooks for business events
// No-op when webhook URL is not configured

export type SlackChannel = 'activity' | 'signups';

/**
 * Send a notification to a Slack channel.
 * Silently skips if the webhook URL is not configured.
 */
export async function notifySlack(
  channel: SlackChannel,
  message: string,
): Promise<void> {
  const envVar = channel === 'activity'
    ? 'SLACK_WEBHOOK_ACTIVITY'
    : 'SLACK_WEBHOOK_SIGNUPS';
  const webhookUrl = process.env[envVar];

  if (!webhookUrl) {
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });

    if (!response.ok) {
      console.error(`Slack notification failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Slack notification error:', error);
  }
}
