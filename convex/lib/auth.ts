// Authentication helpers for Convex functions
// Provides user authentication and lookup utilities

import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

/**
 * Get the authenticated user's Convex ID
 * Throws an error if the user is not authenticated or not found in the database
 * Note: Only works in queries/mutations (not actions - they don't have ctx.db)
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<'users'>> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error('Unauthorized: Not authenticated');
  }

  // The subject field contains the Clerk user ID
  const clerkId = identity.subject;

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', q => q.eq('clerkId', clerkId))
    .unique();

  if (!user) {
    throw new Error('Unauthorized: User not found in database');
  }

  return user._id;
}

/**
 * Get the authenticated user's identity without requiring database lookup
 * Useful for actions that need auth but not the full user record
 */
export async function getAuthIdentity(
  ctx: { auth: { getUserIdentity: () => Promise<{ subject: string; email?: string; name?: string } | null> } },
): Promise<{ clerkId: string; email?: string; name?: string }> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error('Unauthorized: Not authenticated');
  }

  return {
    clerkId: identity.subject,
    email: identity.email,
    name: identity.name,
  };
}

/**
 * Optional auth - returns user ID if authenticated, null otherwise
 * Useful for queries that can work with or without authentication
 */
export async function optionalAuth(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', q => q.eq('clerkId', identity.subject))
    .unique();

  return user?._id ?? null;
}

/**
 * Require admin access - checks if user's email is in the admin allowlist
 * Returns the user ID and email if authorized
 *
 * Admin allowlist is stored in platformSettings.adminEmails
 * @throws Error if user is not authenticated or not an admin
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<{ userId: Id<'users'>; email: string }> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error('Unauthorized: Not authenticated');
  }

  const email = identity.email;
  if (!email) {
    throw new Error('Unauthorized: No email in identity');
  }

  // Get admin allowlist from platform settings
  const settings = await ctx.db
    .query('platformSettings')
    .withIndex('by_key', q => q.eq('key', 'singleton'))
    .unique();

  const allowlist = settings?.adminEmails ?? [];

  // Case-insensitive email comparison
  const normalizedEmail = email.toLowerCase();
  const isAdmin = allowlist.some(
    adminEmail => adminEmail.toLowerCase() === normalizedEmail,
  );

  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  // Get user record
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', q => q.eq('clerkId', identity.subject))
    .unique();

  if (!user) {
    throw new Error('Unauthorized: User not found in database');
  }

  return { userId: user._id, email: normalizedEmail };
}

/**
 * Check if a user is an admin (non-throwing version)
 * Returns true if the user's email is in the admin allowlist
 */
export async function isAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity?.email) {
    return false;
  }

  const settings = await ctx.db
    .query('platformSettings')
    .withIndex('by_key', q => q.eq('key', 'singleton'))
    .unique();

  const allowlist = settings?.adminEmails ?? [];
  const normalizedEmail = identity.email.toLowerCase();

  return allowlist.some(
    adminEmail => adminEmail.toLowerCase() === normalizedEmail,
  );
}
