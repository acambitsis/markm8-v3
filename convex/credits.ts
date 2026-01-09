// Credit operations
// Handles balance tracking, reservations, and transactions
// All pricing values fetched from platformSettings (no hardcoded defaults)

import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { internalMutation, internalQuery, query } from './_generated/server';
import { requireAuth } from './lib/auth';
import { addDecimal, isGreaterOrEqual, isPositive, subtractDecimal } from './lib/decimal';

// =============================================================================
// Helper functions (for use in mutations - single source of truth)
// =============================================================================

/**
 * Reserve credit for grading (helper function)
 * Can be called directly from any mutation that has ctx.db access.
 *
 * @throws Error if no credits found or insufficient balance
 */
export async function reserveCreditForUser(
  ctx: MutationCtx,
  userId: Id<'users'>,
  amount: string,
): Promise<Id<'credits'>> {
  const credits = await ctx.db
    .query('credits')
    .withIndex('by_user_id', q => q.eq('userId', userId))
    .unique();

  if (!credits) {
    throw new Error('No credits found for user');
  }

  // Balance is the spendable amount
  if (!isGreaterOrEqual(credits.balance, amount)) {
    throw new Error(
      `Insufficient credits. Need ${amount} but only have ${credits.balance} available.`,
    );
  }

  // Deduct from balance, track in reserved
  await ctx.db.patch(credits._id, {
    balance: subtractDecimal(credits.balance, amount),
    reserved: addDecimal(credits.reserved, amount),
  });

  return credits._id;
}

// =============================================================================
// Queries
// =============================================================================

/**
 * Get the current user's credit balance
 *
 * Credit semantics (Option A - "deduct at submission"):
 * - `balance` = spendable credits (already reduced by pending operations)
 * - `reserved` = informational only (tracks credits in pending grading)
 * - `available` = balance (since balance is already the spendable amount)
 *
 * Flow:
 * - On submit: balance -= cost, reserved += cost
 * - On success: reserved -= cost (balance unchanged, already deducted)
 * - On failure: balance += cost, reserved -= cost (refund)
 */
export const getBalance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    // Fetch grading cost from platformSettings
    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (!settings) {
      throw new Error(
        'platformSettings not found. Run seed script: npx convex run seed/platformSettings:seed',
      );
    }

    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();

    if (!credits) {
      return {
        balance: '0.00',
        reserved: '0.00',
        available: '0.00',
        gradingCost: settings.gradingCostPerEssay,
      };
    }

    // Balance IS the available amount (already reduced by pending operations)
    // Reserved is informational only
    return {
      balance: credits.balance,
      reserved: credits.reserved,
      available: credits.balance, // Not balance - reserved!
      gradingCost: settings.gradingCostPerEssay,
    };
  },
});

/**
 * Get the current user's transaction history
 * Returns transactions sorted by creation time (newest first)
 * Excludes admin-only fields (adminNote, performedBy) for privacy
 */
export const getTransactionHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const transactions = await ctx.db
      .query('creditTransactions')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .order('desc')
      .collect();

    // Return only user-facing fields (exclude adminNote, performedBy)
    return transactions.map(tx => ({
      _id: tx._id,
      amount: tx.amount,
      transactionType: tx.transactionType,
      description: tx.description,
      createdAt: tx._creationTime,
    }));
  },
});

/**
 * Initialize credits for a new user (internal mutation)
 * Called when a user is created via Clerk webhook
 * Caller must provide signupBonus (fetched from platformSettings.getSignupBonus)
 */
export const initializeForUser = internalMutation({
  args: {
    userId: v.id('users'),
    signupBonus: v.string(), // Required - caller fetches from platformSettings
  },
  handler: async (ctx, { userId, signupBonus }) => {
    // Check if credits already exist
    const existingCredits = await ctx.db
      .query('credits')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();

    if (existingCredits) {
      return existingCredits._id;
    }

    // Create credits record
    const creditsId = await ctx.db.insert('credits', {
      userId,
      balance: signupBonus,
      reserved: '0.00',
    });

    // Record signup bonus transaction if bonus > 0
    if (isPositive(signupBonus)) {
      await ctx.db.insert('creditTransactions', {
        userId,
        amount: signupBonus,
        transactionType: 'signup_bonus',
        description: 'Welcome bonus for new signup',
      });
    }

    return creditsId;
  },
});

/**
 * Reserve credit for grading (internal mutation)
 * Wrapper around reserveCreditForUser helper for use from actions.
 */
export const reserveCredit = internalMutation({
  args: {
    userId: v.id('users'),
    amount: v.string(),
  },
  handler: async (ctx, { userId, amount }) => {
    return reserveCreditForUser(ctx, userId, amount);
  },
});

/**
 * Clear credit reservation after successful grading (internal mutation)
 * The credit was already deducted, just clear the reservation
 */
export const clearReservation = internalMutation({
  args: {
    userId: v.id('users'),
    amount: v.string(),
    gradeId: v.id('grades'),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { userId, amount, gradeId, description }) => {
    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();

    if (!credits) {
      throw new Error('No credits found for user');
    }

    // Clear reservation only (balance was already deducted)
    await ctx.db.patch(credits._id, {
      reserved: subtractDecimal(credits.reserved, amount),
    });

    // Record the transaction
    await ctx.db.insert('creditTransactions', {
      userId,
      amount: `-${amount}`,
      transactionType: 'grading',
      description: description ?? 'Essay grading',
      gradeId,
    });
  },
});

/**
 * Refund credit reservation after failed grading (internal mutation)
 * Restore the credit to balance and clear reservation
 */
export const refundReservation = internalMutation({
  args: {
    userId: v.id('users'),
    amount: v.string(),
    gradeId: v.id('grades'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { userId, amount, gradeId, reason }) => {
    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();

    if (!credits) {
      throw new Error('No credits found for user');
    }

    // Refund: balance + amount, reserved - amount
    await ctx.db.patch(credits._id, {
      balance: addDecimal(credits.balance, amount),
      reserved: subtractDecimal(credits.reserved, amount),
    });

    // Record the refund transaction
    await ctx.db.insert('creditTransactions', {
      userId,
      amount, // Positive amount for refund
      transactionType: 'refund',
      description: reason ?? 'Grading failed - credit refunded',
      gradeId,
    });
  },
});

/**
 * Add credits from a purchase (internal mutation)
 * Called after successful Stripe payment
 */
export const addFromPurchase = internalMutation({
  args: {
    userId: v.id('users'),
    amount: v.string(),
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, { userId, amount, stripePaymentIntentId }) => {
    let credits = await ctx.db
      .query('credits')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();

    // Create credits record if it doesn't exist (defensive coding)
    if (!credits) {
      const creditsId = await ctx.db.insert('credits', {
        userId,
        balance: '0.00',
        reserved: '0.00',
      });
      credits = await ctx.db.get(creditsId);
      if (!credits) {
        throw new Error('Failed to create credits record');
      }
    }

    // Add to balance
    await ctx.db.patch(credits._id, {
      balance: addDecimal(credits.balance, amount),
    });

    // Record the transaction
    await ctx.db.insert('creditTransactions', {
      userId,
      amount,
      transactionType: 'purchase',
      description: `Purchased ${amount} credits`,
      stripePaymentIntentId,
    });
  },
});

/**
 * Check if a payment has already been processed (for idempotency)
 * Used by Stripe webhook to prevent duplicate credit additions
 */
export const getByPaymentIntentId = internalQuery({
  args: { stripePaymentIntentId: v.string() },
  handler: async (ctx, { stripePaymentIntentId }) => {
    return await ctx.db
      .query('creditTransactions')
      .withIndex('by_stripe_payment_intent_id', q =>
        q.eq('stripePaymentIntentId', stripePaymentIntentId))
      .first();
  },
});
