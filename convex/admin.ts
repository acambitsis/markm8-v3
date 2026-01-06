// Admin queries and mutations
// All functions require admin access via email allowlist in platformSettings

import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { isAdmin, requireAdmin } from './lib/auth';
import { addDecimal, isNegative, isZero } from './lib/decimal';
import { aiConfigValidator, transactionTypeValidator } from './schema';

/**
 * Simple email validation function
 * Avoids regex to prevent ReDoS vulnerabilities
 * Checks: has exactly one @, non-empty local and domain parts, domain has a dot
 */
function isValidEmail(email: string): boolean {
  const atIndex = email.indexOf('@');
  if (atIndex < 1) {
    return false;
  } // No @ or @ at start
  if (email.includes('@', atIndex + 1)) {
    return false;
  } // Multiple @
  const domain = email.slice(atIndex + 1);
  if (domain.length < 3) {
    return false;
  } // Domain too short (a.b minimum)
  const dotIndex = domain.indexOf('.');
  if (dotIndex < 1 || dotIndex === domain.length - 1) {
    return false;
  } // No dot, or at start/end
  return true;
}

// =============================================================================
// Queries
// =============================================================================

/**
 * Check if the current user is an admin
 * Used by client to show/hide admin UI elements
 */
export const checkIsAdmin = query({
  args: {},
  handler: async (ctx) => {
    return isAdmin(ctx);
  },
});

/**
 * Get dashboard statistics
 * Returns counts and metrics for admin overview
 */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // Get total users
    const users = await ctx.db.query('users').collect();
    const totalUsers = users.length;

    // Get essays submitted today
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayMs = startOfDay.getTime();

    const allEssays = await ctx.db.query('essays').collect();
    // Filter out soft-deleted essays
    const activeEssays = allEssays.filter(e => e.deletedAt === undefined);
    const essaysToday = activeEssays.filter(
      e => e.submittedAt && e.submittedAt >= startOfDayMs,
    ).length;
    const totalEssays = activeEssays.filter(e => e.status === 'submitted').length;

    // Get total credits purchased (sum of purchase transactions)
    const purchaseTransactions = await ctx.db
      .query('creditTransactions')
      .collect();

    const totalPurchased = purchaseTransactions
      .filter(t => t.transactionType === 'purchase')
      .reduce((sum, t) => sum + Number.parseFloat(t.amount), 0);

    // Get recent signups (last 7 days)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentSignups = users.filter(
      u => u._creationTime >= sevenDaysAgo,
    ).length;

    return {
      totalUsers,
      recentSignups,
      essaysToday,
      totalEssays,
      totalCreditsPurchased: totalPurchased.toFixed(2),
    };
  },
});

/**
 * Get recent activity for admin dashboard
 * Returns latest signups, essays, and purchases
 */
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 10 }) => {
    await requireAdmin(ctx);

    // Get recent users
    const users = await ctx.db.query('users').order('desc').take(limit);

    // Get recent transactions (purchases only)
    const transactions = await ctx.db
      .query('creditTransactions')
      .order('desc')
      .take(limit * 2); // Fetch more since we filter
    const purchaseTransactions = transactions.filter(t => t.transactionType === 'purchase');

    // Get recent essays (filter soft-deleted and get only submitted)
    const essays = await ctx.db
      .query('essays')
      .order('desc')
      .take(limit * 2); // Fetch more since we filter
    const submittedEssays = essays.filter(
      e => e.status === 'submitted' && e.deletedAt === undefined,
    );

    // Batch load users for transactions and essays to avoid N+1
    const userIdsToFetch = new Set<Id<'users'>>();
    for (const tx of purchaseTransactions) {
      userIdsToFetch.add(tx.userId);
    }
    for (const essay of submittedEssays) {
      userIdsToFetch.add(essay.userId);
    }

    // Fetch all needed users in parallel
    const userMap = new Map<string, { email: string }>();
    await Promise.all(
      Array.from(userIdsToFetch).map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (user) {
          userMap.set(userId, { email: user.email });
        }
      }),
    );

    // Combine and format activities
    const activities: Array<{
      type: 'signup' | 'purchase' | 'essay';
      timestamp: number;
      description: string;
      email?: string;
      amount?: string;
    }> = [];

    // Add user signups
    for (const user of users) {
      activities.push({
        type: 'signup',
        timestamp: user._creationTime,
        description: `New user signed up`,
        email: user.email,
      });
    }

    // Add purchases (using batched user lookups)
    for (const tx of purchaseTransactions) {
      const user = userMap.get(tx.userId);
      activities.push({
        type: 'purchase',
        timestamp: tx._creationTime,
        description: `Credit purchase`,
        email: user?.email,
        amount: tx.amount,
      });
    }

    // Add essay submissions (using batched user lookups)
    for (const essay of submittedEssays) {
      const user = userMap.get(essay.userId);
      activities.push({
        type: 'essay',
        timestamp: essay.submittedAt ?? essay._creationTime,
        description: `Essay submitted`,
        email: user?.email,
      });
    }

    // Sort by timestamp descending and take limit
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});

/**
 * Get paginated list of users
 * Supports search by email (exact match via index) or name (partial match)
 */
export const getUsers = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { search, limit = 50 }) => {
    await requireAdmin(ctx);

    let users: Doc<'users'>[] = [];

    if (search) {
      const searchLower = search.toLowerCase().trim();

      // Try exact email match first (uses by_email index - works at any scale)
      if (searchLower.includes('@')) {
        const exactMatch = await ctx.db
          .query('users')
          .withIndex('by_email', q => q.eq('email', searchLower))
          .first();
        if (exactMatch) {
          users = [exactMatch];
        }
      }

      // If no exact email match, search recent users by partial email/name
      if (users.length === 0) {
        const recentUsers = await ctx.db.query('users').order('desc').take(500);
        users = recentUsers.filter(
          u =>
            u.email.toLowerCase().includes(searchLower)
            || u.name?.toLowerCase().includes(searchLower),
        );
      }
    } else {
      // No search - return recent users
      users = await ctx.db.query('users').order('desc').take(500);
    }

    // Get credit balances for each user
    const usersWithCredits = await Promise.all(
      users.slice(0, limit).map(async (user) => {
        const credits = await ctx.db
          .query('credits')
          .withIndex('by_user_id', q => q.eq('userId', user._id))
          .unique();

        const essays = await ctx.db
          .query('essays')
          .withIndex('by_user_id', q => q.eq('userId', user._id))
          .collect();

        // Filter out soft-deleted essays when counting
        const submittedEssayCount = essays.filter(
          e => e.status === 'submitted' && e.deletedAt === undefined,
        ).length;

        return {
          _id: user._id,
          email: user.email,
          name: user.name,
          imageUrl: user.imageUrl,
          institution: user.institution,
          createdAt: user._creationTime,
          creditBalance: credits?.balance ?? '0.00',
          essayCount: submittedEssayCount,
        };
      }),
    );

    return usersWithCredits;
  },
});

/**
 * Get detailed user information
 * Includes profile, credits, and recent transactions
 */
export const getUserDetail = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();

    const transactions = await ctx.db
      .query('creditTransactions')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .order('desc')
      .take(20);

    // Fetch more essays since we filter soft-deleted ones
    const essays = await ctx.db
      .query('essays')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .order('desc')
      .take(20);

    // Filter out soft-deleted essays
    const activeEssays = essays
      .filter(e => e.deletedAt === undefined)
      .slice(0, 10);

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
        institution: user.institution,
        course: user.course,
        createdAt: user._creationTime,
      },
      credits: {
        balance: credits?.balance ?? '0.00',
        reserved: credits?.reserved ?? '0.00',
      },
      transactions: transactions.map(t => ({
        _id: t._id,
        amount: t.amount,
        type: t.transactionType,
        description: t.description,
        adminNote: t.adminNote,
        createdAt: t._creationTime,
      })),
      recentEssays: activeEssays.map(e => ({
        _id: e._id,
        title: e.assignmentBrief?.title ?? 'Untitled',
        status: e.status,
        submittedAt: e.submittedAt,
      })),
    };
  },
});

/**
 * Get filtered transaction log
 * Supports filtering by user, type, and date range
 */
export const getTransactions = query({
  args: {
    userId: v.optional(v.id('users')),
    transactionType: v.optional(transactionTypeValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, transactionType, limit = 50 }) => {
    await requireAdmin(ctx);

    let transactions;

    if (userId) {
      transactions = await ctx.db
        .query('creditTransactions')
        .withIndex('by_user_id', q => q.eq('userId', userId))
        .order('desc')
        .take(100);
    } else {
      transactions = await ctx.db
        .query('creditTransactions')
        .order('desc')
        .take(100);
    }

    // Filter by type if provided
    if (transactionType) {
      transactions = transactions.filter(t => t.transactionType === transactionType);
    }

    // Slice to limit before processing
    const limitedTransactions = transactions.slice(0, limit);

    // Batch load all users to avoid N+1 queries
    const userIdsToFetch = new Set<Id<'users'>>();
    for (const tx of limitedTransactions) {
      userIdsToFetch.add(tx.userId);
      if (tx.performedBy) {
        userIdsToFetch.add(tx.performedBy);
      }
    }

    // Fetch all needed users in parallel
    const userMap = new Map<string, { email: string }>();
    await Promise.all(
      Array.from(userIdsToFetch).map(async (id) => {
        const user = await ctx.db.get(id);
        if (user) {
          userMap.set(id, { email: user.email });
        }
      }),
    );

    // Map transactions with user data from batch lookup
    const transactionsWithUsers = limitedTransactions.map((tx) => {
      const user = userMap.get(tx.userId);
      const performedByUser = tx.performedBy
        ? userMap.get(tx.performedBy)
        : null;

      return {
        _id: tx._id,
        userId: tx.userId,
        userEmail: user?.email ?? 'Unknown',
        amount: tx.amount,
        type: tx.transactionType,
        description: tx.description,
        adminNote: tx.adminNote,
        performedBy: performedByUser?.email,
        createdAt: tx._creationTime,
      };
    });

    return transactionsWithUsers;
  },
});

/**
 * Get platform settings (admin only)
 * Returns full settings including admin allowlist
 */
export const getPlatformSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (!settings) {
      return {
        signupBonusAmount: '1.00',
        adminEmails: [],
        aiConfig: null,
      };
    }

    return {
      signupBonusAmount: settings.signupBonusAmount,
      adminEmails: settings.adminEmails ?? [],
      aiConfig: settings.aiConfig,
    };
  },
});

// =============================================================================
// Mutations
// =============================================================================

/**
 * Adjust a user's credit balance
 * Requires a reason of at least 10 characters for audit trail
 */
export const adjustCredits = mutation({
  args: {
    userId: v.id('users'),
    amount: v.string(), // Can be negative: "-1.00"
    reason: v.string(),
  },
  handler: async (ctx, { userId, amount, reason }) => {
    const admin = await requireAdmin(ctx);

    // Validate reason length
    if (reason.length < 10) {
      throw new Error('Reason must be at least 10 characters');
    }

    // Validate amount format - must be a valid decimal string
    const amountNum = Number.parseFloat(amount);
    if (Number.isNaN(amountNum)) {
      throw new TypeError('Invalid amount format');
    }

    // Don't allow zero adjustments
    if (isZero(amount)) {
      throw new Error('Adjustment amount cannot be zero');
    }

    // Get user's current credits
    const credits = await ctx.db
      .query('credits')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .unique();

    if (!credits) {
      throw new Error('User has no credit record');
    }

    // Calculate new balance using decimal helpers
    const newBalance = addDecimal(credits.balance, amount);

    // Don't allow negative balance - use decimal helper instead of parseFloat
    if (isNegative(newBalance)) {
      throw new Error(
        `Cannot reduce balance below zero. Current: ${credits.balance}, Adjustment: ${amount}`,
      );
    }

    // Update balance
    await ctx.db.patch(credits._id, {
      balance: newBalance,
    });

    // Create transaction record
    await ctx.db.insert('creditTransactions', {
      userId,
      amount,
      transactionType: 'admin_adjustment',
      description: `Admin credit adjustment`,
      adminNote: reason,
      performedBy: admin.userId,
    });

    return {
      success: true,
      previousBalance: credits.balance,
      newBalance,
    };
  },
});

/**
 * Update platform settings
 * Can update signup bonus, admin emails, and AI config
 */
export const updatePlatformSettings = mutation({
  args: {
    signupBonusAmount: v.optional(v.string()),
    adminEmails: v.optional(v.array(v.string())),
    aiConfig: v.optional(aiConfigValidator),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    // Normalize and validate admin emails
    let normalizedEmails: string[] | undefined;
    if (args.adminEmails) {
      normalizedEmails = args.adminEmails.map(e => e.toLowerCase().trim());
      // Validate all email formats
      for (const email of normalizedEmails) {
        if (!isValidEmail(email)) {
          throw new Error(`Invalid email format: ${email}`);
        }
      }
    }

    // Prevent admin from removing themselves from the allowlist
    if (normalizedEmails && !normalizedEmails.includes(admin.email)) {
      throw new Error('Cannot remove yourself from the admin allowlist');
    }

    const updates: Record<string, unknown> = {
      updatedBy: admin.userId,
    };

    if (args.signupBonusAmount !== undefined) {
      // Validate bonus amount
      const bonus = Number.parseFloat(args.signupBonusAmount);
      if (Number.isNaN(bonus) || bonus < 0) {
        throw new Error('Invalid signup bonus amount');
      }
      updates.signupBonusAmount = args.signupBonusAmount;
    }

    if (normalizedEmails !== undefined) {
      updates.adminEmails = normalizedEmails;
    }

    if (args.aiConfig !== undefined) {
      // Validate AI config business rules (beyond schema validation)
      const { grading, titleGeneration } = args.aiConfig;

      // Grading runs: 1-10 required
      if (grading.runs.length < 1) {
        throw new Error('At least one grading run is required');
      }
      if (grading.runs.length > 10) {
        throw new Error('Maximum 10 grading runs allowed');
      }

      // Temperature: 0-1 range
      if (grading.temperature < 0 || grading.temperature > 1) {
        throw new Error('Grading temperature must be between 0 and 1');
      }
      if (titleGeneration.temperature < 0 || titleGeneration.temperature > 1) {
        throw new Error('Title generation temperature must be between 0 and 1');
      }

      // Outlier threshold: 0-100 range
      if (grading.outlierThresholdPercent < 0 || grading.outlierThresholdPercent > 100) {
        throw new Error('Outlier threshold must be between 0 and 100');
      }

      // Max retries: non-negative
      if (grading.retry.maxRetries < 0) {
        throw new Error('Max retries cannot be negative');
      }

      // Max tokens: positive
      if (titleGeneration.maxTokens < 1) {
        throw new Error('Max tokens must be at least 1');
      }

      updates.aiConfig = args.aiConfig;
    }

    if (settings) {
      await ctx.db.patch(settings._id, updates);
    } else {
      throw new Error('Platform settings not found. Run seed script first.');
    }

    return { success: true };
  },
});

/**
 * Add an admin email to the allowlist
 */
export const addAdminEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    await requireAdmin(ctx);

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format with proper regex
    if (!isValidEmail(normalizedEmail)) {
      throw new Error('Invalid email format');
    }

    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (!settings) {
      throw new Error('Platform settings not found');
    }

    const currentEmails = settings.adminEmails ?? [];

    // Check if already exists
    if (currentEmails.some(e => e.toLowerCase() === normalizedEmail)) {
      throw new Error('Email already in admin allowlist');
    }

    await ctx.db.patch(settings._id, {
      adminEmails: [...currentEmails, normalizedEmail],
    });

    return { success: true };
  },
});

/**
 * Remove an admin email from the allowlist
 */
export const removeAdminEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const admin = await requireAdmin(ctx);

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent removing self
    if (normalizedEmail === admin.email) {
      throw new Error('Cannot remove yourself from the admin allowlist');
    }

    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (!settings) {
      throw new Error('Platform settings not found');
    }

    const currentEmails = settings.adminEmails ?? [];
    const newEmails = currentEmails.filter(
      e => e.toLowerCase() !== normalizedEmail,
    );

    // Ensure at least one admin remains
    if (newEmails.length === 0) {
      throw new Error('Cannot remove the last admin');
    }

    await ctx.db.patch(settings._id, {
      adminEmails: newEmails,
    });

    return { success: true };
  },
});
