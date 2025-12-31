// User queries and mutations
// Handles user profile operations

import { v } from 'convex/values';

import { internalMutation, mutation, query } from './_generated/server';
import { requireAuth } from './lib/auth';

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
    defaultGradingScale: v.optional(
      v.union(
        v.literal('percentage'),
        v.literal('letter'),
        v.literal('uk'),
        v.literal('gpa'),
        v.literal('pass_fail'),
      ),
    ),
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
 * Get user by Clerk ID (internal use)
 */
export const getByClerkId = query({
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
      throw new Error(`User not found: ${args.clerkId}`);
    }

    await ctx.db.patch(user._id, {
      ...(args.email && { email: args.email }),
      ...(args.name !== undefined && { name: args.name }),
      ...(args.imageUrl !== undefined && { imageUrl: args.imageUrl }),
    });

    return user._id;
  },
});

/**
 * Delete user from Clerk webhook (internal mutation)
 */
export const deleteFromClerk = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', q => q.eq('clerkId', clerkId))
      .unique();

    if (user) {
      // Cascade delete will be handled by Convex
      await ctx.db.delete(user._id);
    }
  },
});
