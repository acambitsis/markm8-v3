// Credit operations
// Handles balance tracking, reservations, and transactions

import { v } from 'convex/values';

import { internalMutation, query } from './_generated/server';
import { requireAuth } from './lib/auth';
import { addDecimal, isGreaterOrEqual, subtractDecimal } from './lib/decimal';

const DEFAULT_SIGNUP_BONUS = '1.00';

/**
 * Get the current user's credit balance
 * Returns balance, reserved, and available (balance - reserved)
 */
export const getBalance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();

    if (!credits) {
      return {
        balance: '0.00',
        reserved: '0.00',
        available: '0.00',
      };
    }

    const available = subtractDecimal(credits.balance, credits.reserved);

    return {
      balance: credits.balance,
      reserved: credits.reserved,
      available,
    };
  },
});

/**
 * Initialize credits for a new user (internal mutation)
 * Called when a user is created via Clerk webhook
 */
export const initializeForUser = internalMutation({
  args: {
    userId: v.id('users'),
    signupBonus: v.optional(v.string()),
  },
  handler: async (ctx, { userId, signupBonus }) => {
    const bonus = signupBonus ?? DEFAULT_SIGNUP_BONUS;

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
      balance: bonus,
      reserved: '0.00',
    });

    // Record signup bonus transaction if bonus > 0
    if (Number.parseFloat(bonus) > 0) {
      await ctx.db.insert('creditTransactions', {
        userId,
        amount: bonus,
        transactionType: 'signup_bonus',
        description: 'Welcome bonus for new signup',
      });
    }

    return creditsId;
  },
});

/**
 * Reserve credit for grading (internal mutation)
 * Called when an essay is submitted
 */
export const reserveCredit = internalMutation({
  args: {
    userId: v.id('users'),
    amount: v.string(),
  },
  handler: async (ctx, { userId, amount }) => {
    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();

    if (!credits) {
      throw new Error('No credits found for user');
    }

    const available = subtractDecimal(credits.balance, credits.reserved);

    if (!isGreaterOrEqual(available, amount)) {
      throw new Error(
        `Insufficient credits. Need ${amount} but only have ${available} available.`,
      );
    }

    // Reserve: balance - amount, reserved + amount
    await ctx.db.patch(credits._id, {
      balance: subtractDecimal(credits.balance, amount),
      reserved: addDecimal(credits.reserved, amount),
    });

    return credits._id;
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
    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();

    if (!credits) {
      throw new Error('No credits found for user');
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
