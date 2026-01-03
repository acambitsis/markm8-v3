// User queries and mutations
// Handles user profile operations

import { v } from 'convex/values';

import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { requireAuth } from './lib/auth';
import { gradingScaleValidator } from './schema';

/**
 * Get the current authenticated user's profile
 */
export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    const user = await ctx.db.get(userId);
    return user;
  },
});

/**
 * Update the current user's profile settings
 */
export const updateProfile = mutation({
  args: {
    institution: v.optional(v.string()),
    course: v.optional(v.string()),
    defaultGradingScale: v.optional(gradingScaleValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    await ctx.db.patch(userId, {
      institution: args.institution,
      course: args.course,
      defaultGradingScale: args.defaultGradingScale,
    });

    return await ctx.db.get(userId);
  },
});

/**
 * Get user by Clerk ID (internal use only)
 * Not exposed to clients - prevents PII leakage
 */
export const getByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', q => q.eq('clerkId', clerkId))
      .unique();
  },
});

/**
 * Create a new user from Clerk webhook (internal mutation)
 * Called by the HTTP webhook handler
 */
export const createFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', q => q.eq('clerkId', args.clerkId))
      .unique();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert('users', {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
    });

    return userId;
  },
});

/**
 * Update user from Clerk webhook (internal mutation)
 * Uses upsert pattern - creates user if they don't exist
 * This handles race conditions where user.updated fires before user.created
 */
export const updateFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', q => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) {
      // User doesn't exist - this can happen if user.updated fires before
      // user.created is processed, or when using dev Convex with prod Clerk.
      // Create the user instead of failing.
      if (!args.email) {
        throw new Error(`Cannot create user without email: ${args.clerkId}`);
      }

      const userId = await ctx.db.insert('users', {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });

      return userId;
    }

    await ctx.db.patch(user._id, {
      ...(args.email && { email: args.email }),
      ...(args.name !== undefined && { name: args.name }),
      ...(args.imageUrl !== undefined && { imageUrl: args.imageUrl }),
    });

    // Return undefined for updates (userId is only returned for new user creation)
    return undefined;
  },
});

/**
 * Get user by ID (internal query for webhook validation)
 */
export const getById = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

/**
 * Get current user's checkout info (authenticated)
 * Returns minimal fields needed for checkout - prevents PII leakage
 * Security: Verifies caller is authenticated and returns only their own data
 */
export const getMyCheckoutInfo = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', q => q.eq('clerkId', identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    // Return only fields needed for checkout
    return {
      _id: user._id,
      email: user.email,
    };
  },
});

/**
 * Delete user from Clerk webhook (internal mutation)
 * Implements explicit cascade delete for all user-owned resources
 *
 * Note: Convex does NOT auto-cascade deletes. We must manually delete:
 * - credits
 * - creditTransactions
 * - grades
 * - essays
 */
export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', q => q.eq('clerkId', clerkId))
      .unique();

    if (!user) {
      return;
    }

    // 1. Delete all grades for this user
    const grades = await ctx.db
      .query('grades')
      .withIndex('by_user_id', q => q.eq('userId', user._id))
      .collect();
    for (const grade of grades) {
      await ctx.db.delete(grade._id);
    }

    // 2. Delete all essays for this user
    const essays = await ctx.db
      .query('essays')
      .withIndex('by_user_id', q => q.eq('userId', user._id))
      .collect();
    for (const essay of essays) {
      await ctx.db.delete(essay._id);
    }

    // 3. Delete all credit transactions for this user
    const transactions = await ctx.db
      .query('creditTransactions')
      .withIndex('by_user_id', q => q.eq('userId', user._id))
      .collect();
    for (const txn of transactions) {
      await ctx.db.delete(txn._id);
    }

    // 4. Delete credits record for this user
    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user_id', q => q.eq('userId', user._id))
      .unique();
    if (credits) {
      await ctx.db.delete(credits._id);
    }

    // 5. Finally, delete the user
    await ctx.db.delete(user._id);
  },
});
