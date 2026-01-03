// HTTP endpoints for webhooks
// Handles Clerk user sync and Stripe payments
/* eslint-disable no-console */

import { httpRouter } from 'convex/server';
import Stripe from 'stripe';
import { Webhook } from 'svix';

import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
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
        // updateFromClerk returns a userId if it created a new user (upsert)
        const newUserId = await ctx.runMutation(internal.users.updateFromClerk, {
          clerkId: id,
          email,
          name,
          imageUrl: image_url ?? undefined,
        });

        // If a new user was created via upsert (race condition handling),
        // initialize their credits with signup bonus
        if (newUserId) {
          const signupBonus = await ctx.runQuery(
            internal.platformSettings.getSignupBonus,
            {},
          );
          await ctx.runMutation(internal.credits.initializeForUser, {
            userId: newUserId,
            signupBonus,
          });
          console.log('User created via upsert with credits:', { userId: newUserId, email });
        } else {
          console.log('User updated successfully:', id);
        }

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
 * Stripe webhook handler
 * Endpoint: POST /stripe-webhook
 *
 * Handles checkout.session.completed events to add credits after purchase.
 * Uses stripePaymentIntentId for idempotency to prevent duplicate credits.
 */
http.route({
  path: '/stripe-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!webhookSecret || !stripeSecretKey) {
      console.error('Stripe secrets not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Get signature header
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.warn('Missing stripe-signature header');
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Get body and verify webhook
    const body = await request.text();
    const stripe = new Stripe(stripeSecretKey);
    let event: Stripe.Event;

    try {
      // Use async version for Convex runtime (uses SubtleCrypto)
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract metadata
      const userId = session.metadata?.userId;
      const credits = session.metadata?.credits;
      const paymentIntentId = session.payment_intent as string;

      if (!userId || !credits || !paymentIntentId) {
        console.error('Missing metadata in checkout session:', {
          sessionId: session.id,
          userId,
          credits,
          paymentIntentId,
        });
        return new Response(
          JSON.stringify({ error: 'Missing metadata' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Idempotency check - prevent duplicate credit additions
      const existingTx = await ctx.runQuery(
        internal.credits.getByPaymentIntentId,
        { stripePaymentIntentId: paymentIntentId },
      );

      if (existingTx) {
        console.log('Payment already processed:', paymentIntentId);
        return new Response(
          JSON.stringify({ success: true, message: 'Already processed' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Validate user exists
      const user = await ctx.runQuery(internal.users.getById, {
        userId: userId as Id<'users'>,
      });

      if (!user) {
        console.error('User not found:', userId);
        // Return 200 to prevent Stripe retries for permanent failure
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Add credits
      try {
        await ctx.runMutation(internal.credits.addFromPurchase, {
          userId: userId as Id<'users'>,
          amount: credits,
          stripePaymentIntentId: paymentIntentId,
        });

        console.log('Credits added:', { userId, credits, paymentIntentId });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      } catch (error) {
        console.error('Failed to add credits:', error);
        // Return 500 so Stripe will retry
        return new Response(
          JSON.stringify({ error: 'Failed to process payment' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    // Log other events but return success
    console.log('Stripe webhook event received:', event.type);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }),
});

export default http;
