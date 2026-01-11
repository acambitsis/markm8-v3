// Notification actions
// Internal actions for sending notifications from mutations
// (Mutations cannot make external HTTP calls directly)

import { v } from 'convex/values';

import { internalAction } from './_generated/server';
import { notifySlack } from './lib/slack';

/**
 * Send a Slack notification.
 * Called via ctx.scheduler.runAfter() from mutations.
 */
export const sendSlackNotification = internalAction({
  args: {
    channel: v.union(v.literal('activity'), v.literal('signups')),
    message: v.string(),
  },
  handler: async (_ctx, { channel, message }) => {
    await notifySlack(channel, message);
  },
});
