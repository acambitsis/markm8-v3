import { auth } from '@clerk/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { getCreditPackage } from '@/utils/AppConfig';

import { api } from '../../../../../convex/_generated/api';

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for credit purchase.
 * Requires authentication via Clerk.
 *
 * Request body: { packageId: string }
 * Response: { url: string } on success
 */
export async function POST(request: Request) {
  try {
    // Check Stripe configuration
    if (!Env.STRIPE_SECRET_KEY) {
      logger.error('STRIPE_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 },
      );
    }

    // 1. Authenticate user via Clerk
    const { userId: clerkUserId, getToken } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // 2. Get Convex user ID (auth-protected - returns only caller's own data)
    // Pass the Clerk JWT token to Convex for server-side auth
    const token = await getToken({ template: 'convex' });
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token unavailable' },
        { status: 401 },
      );
    }
    const user = await fetchQuery(api.users.getMyCheckoutInfo, {}, { token });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    // 3. Parse and validate package
    const { packageId } = await request.json();
    const creditPackage = getCreditPackage(packageId);

    if (!creditPackage) {
      return NextResponse.json(
        { error: 'Invalid package' },
        { status: 400 },
      );
    }

    // 4. Create Stripe Checkout Session
    const stripe = new Stripe(Env.STRIPE_SECRET_KEY);
    const appUrl = Env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${creditPackage.credits} MarkM8 Credits`,
              description: `Purchase ${creditPackage.credits} credits for essay grading`,
            },
            unit_amount: Math.round(creditPackage.price * 100), // Stripe uses pence
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user._id,
        packageId: creditPackage.id,
        credits: creditPackage.credits.toFixed(2), // Store as string for decimal precision
      },
      success_url: `${appUrl}/settings?tab=credits&success=true`,
      cancel_url: `${appUrl}/settings?tab=credits&canceled=true`,
      customer_email: user.email, // Pre-fill email for better UX
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error(error, 'Checkout error');
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
