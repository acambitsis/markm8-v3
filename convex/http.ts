// HTTP endpoints for webhooks
// Handles Clerk user sync and future Stripe payments
/* eslint-disable no-console */

import { httpRouter } from 'convex/server';
import { Webhook } from 'svix';

import { internal } from './_generated/api';
import { httpAction } from './_generated/server';

const http = httpRouter();

// Clerk webhook types
type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  };
};

/**
 * Clerk webhook handler
 * Endpoint: POST /clerk-webhook
 */
http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET is not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Get headers
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn('Missing svix headers in Clerk webhook');
      return new Response(
        JSON.stringify({ error: 'Missing svix headers' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Get body
    const body = await request.text();

    // Verify the webhook
    const wh = new Webhook(webhookSecret);
    let evt: ClerkWebhookEvent;

    try {
      evt = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('Error verifying Clerk webhook:', err);
      return new Response(
        JSON.stringify({ error: 'Error verifying webhook' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const eventType = evt.type;

    // Handle user.created event
    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      const email = email_addresses?.[0]?.email_address;
      if (!email) {
        console.error('No email found for new user:', id);
        return new Response(
          JSON.stringify({ error: 'No email found' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const name = [first_name, last_name].filter(Boolean).join(' ') || undefined;

      try {
        // Create user in Convex
        const userId = await ctx.runMutation(internal.users.createFromClerk, {
          clerkId: id,
          email,
          name,
          imageUrl: image_url ?? undefined,
        });

        // Get signup bonus from platform settings (not hardcoded)
        const signupBonus = await ctx.runQuery(
          internal.platformSettings.getSignupBonus,
          {},
        );

        // Initialize credits with signup bonus
        await ctx.runMutation(internal.credits.initializeForUser, {
          userId,
          signupBonus,
        });

        console.log('User created successfully:', { userId, email });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      } catch (error) {
        console.error('Error creating user from Clerk webhook:', error);
        return new Response(
          JSON.stringify({ error: 'Error creating user' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    // Handle user.updated event
    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      const email = email_addresses?.[0]?.email_address;
      const name = [first_name, last_name].filter(Boolean).join(' ') || undefined;

      try {
        await ctx.runMutation(internal.users.updateFromClerk, {
          clerkId: id,
          email,
          name,
          imageUrl: image_url ?? undefined,
        });

        console.log('User updated successfully:', id);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      } catch (error) {
        console.error('Error updating user from Clerk webhook:', error);
        return new Response(
          JSON.stringify({ error: 'Error updating user' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    // Handle user.deleted event
    if (eventType === 'user.deleted') {
      const { id } = evt.data;

      try {
        await ctx.runMutation(internal.users.deleteFromClerk, {
          clerkId: id,
        });

        console.log('User deleted successfully:', id);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      } catch (error) {
        console.error('Error deleting user from Clerk webhook:', error);
        return new Response(
          JSON.stringify({ error: 'Error deleting user' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    // Log other events
    console.log('Clerk webhook event received:', eventType);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }),
});

/**
 * Stripe webhook handler (placeholder for Phase 3)
 * Endpoint: POST /stripe-webhook
 */
http.route({
  path: '/stripe-webhook',
  method: 'POST',
  handler: httpAction(async (_ctx, _request) => {
    // TODO: Implement Stripe webhook handling in Phase 3
    // - Verify webhook signature
    // - Handle checkout.session.completed
    // - Add credits to user account

    console.log('Stripe webhook received - not yet implemented');

    return new Response(
      JSON.stringify({ error: 'Not implemented' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } },
    );
  }),
});

export default http;
