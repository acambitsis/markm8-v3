import type { WebhookEvent } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { credits, creditTransactions, platformSettings, users } from '@/models/Schema';

export async function POST(req: Request) {
  const webhookSecret = Env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('CLERK_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.warn('Missing svix headers in Clerk webhook');
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with the secret
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    logger.error('Error verifying Clerk webhook', { error: err });
    return NextResponse.json({ error: 'Error verifying webhook' }, { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses[0]?.email_address;
    if (!email) {
      logger.error('No email found for new user', { userId: id });
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const name = [first_name, last_name].filter(Boolean).join(' ') || null;

    try {
      // Get signup bonus amount from platform settings
      const settings = await db
        .select({ signupBonusAmount: platformSettings.signupBonusAmount })
        .from(platformSettings)
        .where(eq(platformSettings.id, 'singleton'))
        .limit(1);

      const signupBonusAmount = settings[0]?.signupBonusAmount ?? '1.00';
      const bonusAsNumber = Number.parseFloat(signupBonusAmount);

      // Create user, credits, and transaction in a single operation
      // Note: For true atomicity, this would need a transaction wrapper

      // 1. Create user record
      await db.insert(users).values({
        id,
        clerkId: id,
        email,
        name,
        imageUrl: image_url,
      });

      // 2. Create credits record with signup bonus
      await db.insert(credits).values({
        userId: id,
        balance: signupBonusAmount,
        reserved: '0.00',
      });

      // 3. Create credit transaction if bonus > 0
      if (bonusAsNumber > 0) {
        await db.insert(creditTransactions).values({
          userId: id,
          amount: signupBonusAmount,
          transactionType: 'signup_bonus',
          description: 'Welcome bonus for new signup',
        });
      }

      logger.info('User created successfully', {
        userId: id,
        email,
        signupBonus: signupBonusAmount,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('Error creating user from Clerk webhook', { error, userId: id });
      return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
    }
  }

  // Handle other events or ignore them
  logger.debug('Clerk webhook event received', { type: eventType });
  return NextResponse.json({ success: true });
}
