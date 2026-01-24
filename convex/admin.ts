// Admin queries and mutations
// All functions require admin access via email allowlist in platformSettings

import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { validateAiConfig } from './lib/aiConfig';
import { isAdmin, requireAdmin } from './lib/auth';
import { addDecimal, isNegative, isZero } from './lib/decimal';
import { validatePricingValue } from './lib/pricing';
import type { AuditAction, ModelResult } from './schema';
import { aiConfigValidator, auditActionValidator, modelCapabilityValidator, transactionTypeValidator } from './schema';

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

    // Get completed grades with costs for API spend metrics
    // TODO: Add index on completedAt and filter by time range (e.g., last 90 days)
    // when grade volume grows significantly to avoid unbounded memory usage
    const allGrades = await ctx.db.query('grades').collect();
    const completedGrades = allGrades.filter(g => g.status === 'complete' && g.apiCost);

    const totalApiSpend = completedGrades.reduce(
      (sum, g) => sum + Number.parseFloat(g.apiCost || '0'),
      0,
    );

    const gradesToday = completedGrades.filter(
      g => g.completedAt && g.completedAt >= startOfDayMs,
    );
    const todayApiSpend = gradesToday.reduce(
      (sum, g) => sum + Number.parseFloat(g.apiCost || '0'),
      0,
    );

    const avgCostPerEssay = completedGrades.length > 0
      ? totalApiSpend / completedGrades.length
      : 0;

    return {
      totalUsers,
      recentSignups,
      essaysToday,
      totalEssays,
      totalCreditsPurchased: totalPurchased.toFixed(2),
      totalApiSpend: totalApiSpend.toFixed(4),
      todayApiSpend: todayApiSpend.toFixed(4),
      avgCostPerEssay: avgCostPerEssay.toFixed(4),
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

    // Batch load grades for essay activities (for timing info and QA review)
    const essayIdsToFetch = submittedEssays.map(e => e._id);
    const gradeMap = new Map<string, { gradeId: Id<'grades'>; modelResults?: ModelResult[]; apiCost?: string }>();

    // Fetch latest completed grade for each essay
    await Promise.all(
      essayIdsToFetch.map(async (essayId) => {
        const grade = await ctx.db
          .query('grades')
          .withIndex('by_essay_id', q => q.eq('essayId', essayId))
          .order('desc')
          .first();
        if (grade?.status === 'complete') {
          gradeMap.set(essayId, { gradeId: grade._id, modelResults: grade.modelResults, apiCost: grade.apiCost });
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
      gradeId?: Id<'grades'>;
      modelResults?: ModelResult[];
      apiCost?: string;
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

    // Add essay submissions (using batched user and grade lookups)
    for (const essay of submittedEssays) {
      const user = userMap.get(essay.userId);
      const grade = gradeMap.get(essay._id);
      activities.push({
        type: 'essay',
        timestamp: essay.submittedAt ?? essay._creationTime,
        description: `Essay submitted`,
        email: user?.email,
        gradeId: grade?.gradeId,
        modelResults: grade?.modelResults,
        apiCost: grade?.apiCost,
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

    // Batch fetch latest completed grade ID for each essay
    const gradeMap = new Map<string, Id<'grades'>>();
    await Promise.all(
      activeEssays.map(async (essay) => {
        const grade = await ctx.db
          .query('grades')
          .withIndex('by_essay_id', q => q.eq('essayId', essay._id))
          .order('desc')
          .first();
        if (grade?.status === 'complete') {
          gradeMap.set(essay._id, grade._id);
        }
      }),
    );

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
        latestGradeId: gradeMap.get(e._id),
      })),
    };
  },
});

/**
 * Get grade data for QA review (admin only)
 * Returns grade feedback without essay content for privacy
 */
export const getGradeForQA = query({
  args: {
    gradeId: v.id('grades'),
  },
  handler: async (ctx, { gradeId }) => {
    await requireAdmin(ctx);

    const grade = await ctx.db.get(gradeId);
    if (!grade || grade.status !== 'complete') {
      return null;
    }

    // Get essay metadata (NOT content) for context
    const essay = await ctx.db.get(grade.essayId);
    if (!essay) {
      return null;
    }

    // Detect if instructions are the auto-generated default
    // Default template ends with this unique suffix (see convex/essays.ts:238)
    const DEFAULT_INSTRUCTIONS_SUFFIX
      = 'Assess the quality of writing, argument structure, evidence usage, and overall effectiveness. Provide constructive feedback to help improve the essay.';
    const instructions = essay.assignmentBrief?.instructions ?? '';
    const hasCustomInstructions = instructions.length > 0
      && !instructions.includes(DEFAULT_INSTRUCTIONS_SUFFIX);

    // Check for custom rubric criteria
    const customCriteria = essay.rubric?.customCriteria ?? '';
    const hasCustomRubric = customCriteria.length > 0;

    // Get focus areas (safe to expose - just category labels)
    const focusAreas = essay.rubric?.focusAreas ?? [];

    return {
      grade: {
        _id: grade._id,
        status: grade.status,
        percentageRange: grade.percentageRange,
        feedback: grade.feedback,
        categoryScores: grade.categoryScores,
        modelResults: grade.modelResults,
        queuedAt: grade.queuedAt,
        completedAt: grade.completedAt,
        apiCost: grade.apiCost,
        totalTokens: grade.totalTokens,
        promptVersion: grade.promptVersion,
      },
      // Essay metadata only - NO content exposed
      essayMetadata: {
        title: essay.assignmentBrief?.title ?? 'Untitled',
        subject: essay.assignmentBrief?.subject,
        wordCount: essay.wordCount,
        academicLevel: essay.assignmentBrief?.academicLevel,
        submittedAt: essay.submittedAt,
      },
      // Context provided indicators (for support troubleshooting)
      contextProvided: {
        hasCustomInstructions,
        instructionLength: instructions.length,
        hasCustomRubric,
        rubricLength: customCriteria.length,
        focusAreas,
      },
      // Actual grade data (user-provided calibration)
      actualGradeData: essay.actualGrade || essay.actualFeedback
        ? {
            grade: essay.actualGrade,
            feedback: essay.actualFeedback,
            addedAt: essay.actualGradeAddedAt,
          }
        : null,
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

    // Batch load grades for grading transactions (for model timings)
    const gradeIdsToFetch = new Set<Id<'grades'>>();
    for (const tx of limitedTransactions) {
      if (tx.transactionType === 'grading' && tx.gradeId) {
        gradeIdsToFetch.add(tx.gradeId);
      }
    }

    const gradeMap = new Map<string, { modelResults?: Array<{ model: string; percentage: number; included: boolean; reason?: string; durationMs?: number }> }>();
    await Promise.all(
      Array.from(gradeIdsToFetch).map(async (id) => {
        const grade = await ctx.db.get(id);
        if (grade) {
          gradeMap.set(id, { modelResults: grade.modelResults });
        }
      }),
    );

    // Map transactions with user data and grade data from batch lookup
    const transactionsWithUsers = limitedTransactions.map((tx) => {
      const user = userMap.get(tx.userId);
      const performedByUser = tx.performedBy
        ? userMap.get(tx.performedBy)
        : null;
      const grade = tx.gradeId ? gradeMap.get(tx.gradeId) : null;

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
        // Include model results for grading transactions (for duration analysis)
        modelResults: grade?.modelResults,
      };
    });

    return transactionsWithUsers;
  },
});

/**
 * Get platform settings (admin only)
 * Returns full settings including admin allowlist
 * Throws if not seeded - run: npx convex run seed/platformSettings:seed
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
      throw new Error(
        'platformSettings not found. Run seed script: npx convex run seed/platformSettings:seed',
      );
    }

    return {
      signupBonusAmount: settings.signupBonusAmount,
      gradingCostPerEssay: settings.gradingCostPerEssay,
      creditsPerDollar: settings.creditsPerDollar,
      adminEmails: settings.adminEmails ?? [],
      aiConfig: settings.aiConfig,
    };
  },
});

/**
 * Get admin audit log
 * Returns history of admin settings changes
 * Supports optional filtering by action type
 */
export const getAuditLog = query({
  args: {
    action: v.optional(auditActionValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { action, limit = 50 }) => {
    await requireAdmin(ctx);

    let entries;

    if (action) {
      // Filter by action type using index
      entries = await ctx.db
        .query('adminAuditLog')
        .withIndex('by_action', q => q.eq('action', action))
        .order('desc')
        .take(limit);
    } else {
      // Get all entries, ordered by creation time desc
      entries = await ctx.db
        .query('adminAuditLog')
        .order('desc')
        .take(limit);
    }

    return entries.map(entry => ({
      _id: entry._id,
      action: entry.action,
      performedBy: entry.performedBy,
      performedByEmail: entry.performedByEmail,
      changes: entry.changes,
      metadata: entry.metadata,
      createdAt: entry._creationTime,
    }));
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
 * Can update signup bonus, pricing, admin emails, and AI config
 */
export const updatePlatformSettings = mutation({
  args: {
    signupBonusAmount: v.optional(v.string()),
    gradingCostPerEssay: v.optional(v.string()),
    creditsPerDollar: v.optional(v.string()),
    adminEmails: v.optional(v.array(v.string())),
    aiConfig: v.optional(aiConfigValidator),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (!settings) {
      throw new Error('Platform settings not found. Run seed script first.');
    }

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

    // Track audit entries to create after successful update
    const auditEntries: Array<{
      action: AuditAction;
      field: string;
      previousValue: unknown;
      newValue: unknown;
    }> = [];

    if (args.signupBonusAmount !== undefined) {
      // Validate bonus amount
      const bonus = Number.parseFloat(args.signupBonusAmount);
      if (Number.isNaN(bonus) || bonus < 0) {
        throw new Error('Invalid signup bonus amount');
      }
      // Only log if value changed
      if (args.signupBonusAmount !== settings.signupBonusAmount) {
        auditEntries.push({
          action: 'signup_bonus_update',
          field: 'signupBonusAmount',
          previousValue: settings.signupBonusAmount,
          newValue: args.signupBonusAmount,
        });
      }
      updates.signupBonusAmount = args.signupBonusAmount;
    }

    if (args.gradingCostPerEssay !== undefined) {
      // Validate grading cost - must be positive (uses shared validation)
      validatePricingValue(args.gradingCostPerEssay, 'Grading cost');
      // Only log if value changed
      if (args.gradingCostPerEssay !== settings.gradingCostPerEssay) {
        auditEntries.push({
          action: 'pricing_update',
          field: 'gradingCostPerEssay',
          previousValue: settings.gradingCostPerEssay,
          newValue: args.gradingCostPerEssay,
        });
      }
      updates.gradingCostPerEssay = args.gradingCostPerEssay;
    }

    if (args.creditsPerDollar !== undefined) {
      // Validate credits per dollar - must be positive (uses shared validation)
      validatePricingValue(args.creditsPerDollar, 'Credits per pound');
      // Only log if value changed
      if (args.creditsPerDollar !== settings.creditsPerDollar) {
        auditEntries.push({
          action: 'pricing_update',
          field: 'creditsPerDollar',
          previousValue: settings.creditsPerDollar,
          newValue: args.creditsPerDollar,
        });
      }
      updates.creditsPerDollar = args.creditsPerDollar;
    }

    if (normalizedEmails !== undefined) {
      updates.adminEmails = normalizedEmails;
      // Note: individual email changes are tracked via addAdminEmail/removeAdminEmail
      // This bulk update path is for direct array replacement (less common)
    }

    if (args.aiConfig !== undefined) {
      // Validate AI config using centralized validation
      const validation = validateAiConfig(args.aiConfig);
      if (!validation.valid) {
        throw new Error(`Invalid AI configuration: ${validation.errors.join('; ')}`);
      }
      // Note: warnings are non-fatal, log them but allow the update
      for (const warning of validation.warnings) {
        console.warn(`[updatePlatformSettings] ${warning}`);
      }
      // Only log if value changed (compare as JSON strings)
      if (JSON.stringify(args.aiConfig) !== JSON.stringify(settings.aiConfig)) {
        auditEntries.push({
          action: 'ai_config_update',
          field: 'aiConfig',
          previousValue: settings.aiConfig,
          newValue: args.aiConfig,
        });
      }
      updates.aiConfig = args.aiConfig;
    }

    // Apply the update
    await ctx.db.patch(settings._id, updates);

    // Create audit log entries for each changed field
    for (const entry of auditEntries) {
      await ctx.db.insert('adminAuditLog', {
        action: entry.action,
        performedBy: admin.userId,
        performedByEmail: admin.email,
        changes: {
          field: entry.field,
          previousValue: entry.previousValue,
          newValue: entry.newValue,
        },
      });
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
    const admin = await requireAdmin(ctx);

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

    const newEmails = [...currentEmails, normalizedEmail];

    await ctx.db.patch(settings._id, {
      adminEmails: newEmails,
    });

    // Log audit entry
    await ctx.db.insert('adminAuditLog', {
      action: 'admin_email_added',
      performedBy: admin.userId,
      performedByEmail: admin.email,
      changes: {
        field: 'adminEmails',
        previousValue: currentEmails,
        newValue: newEmails,
      },
      metadata: {
        targetEmail: normalizedEmail,
      },
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

    // Log audit entry
    await ctx.db.insert('adminAuditLog', {
      action: 'admin_email_removed',
      performedBy: admin.userId,
      performedByEmail: admin.email,
      changes: {
        field: 'adminEmails',
        previousValue: currentEmails,
        newValue: newEmails,
      },
      metadata: {
        targetEmail: normalizedEmail,
      },
    });

    return { success: true };
  },
});

// =============================================================================
// Model Catalog Management
// =============================================================================

/**
 * Add a new model to the catalog
 * Used by admin UI to add models from OpenRouter
 */
export const addModelToCatalog = mutation({
  args: {
    slug: v.string(), // OpenRouter model ID, e.g., "anthropic/claude-sonnet-4.5"
    name: v.string(), // Display name
    provider: v.string(), // Provider name
    capabilities: v.array(modelCapabilityValidator),
    contextLength: v.optional(v.number()),
    supportsReasoning: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    // Validate slug format (should be provider/model-name)
    if (!args.slug.includes('/')) {
      throw new Error('Invalid model slug format. Expected: provider/model-name');
    }

    // Check if model already exists
    const existing = await ctx.db
      .query('modelCatalog')
      .withIndex('by_slug', q => q.eq('slug', args.slug))
      .unique();

    if (existing) {
      throw new Error(`Model "${args.slug}" already exists in catalog`);
    }

    // Insert new model
    const modelId = await ctx.db.insert('modelCatalog', {
      slug: args.slug,
      name: args.name,
      provider: args.provider,
      enabled: true, // Enable by default
      capabilities: args.capabilities,
      contextLength: args.contextLength,
      supportsReasoning: args.supportsReasoning,
    });

    // Log audit entry
    await ctx.db.insert('adminAuditLog', {
      action: 'model_added',
      performedBy: admin.userId,
      performedByEmail: admin.email,
      changes: {
        field: 'modelCatalog',
        newValue: args.slug,
      },
      metadata: {
        modelSlug: args.slug,
        modelName: args.name,
        provider: args.provider,
      },
    });

    return { success: true, modelId };
  },
});

/**
 * Remove a model from the catalog
 */
export const removeModelFromCatalog = mutation({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, { slug }) => {
    const admin = await requireAdmin(ctx);

    const model = await ctx.db
      .query('modelCatalog')
      .withIndex('by_slug', q => q.eq('slug', slug))
      .unique();

    if (!model) {
      throw new Error(`Model "${slug}" not found in catalog`);
    }

    // Check if model is currently in use
    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (settings?.aiConfig) {
      const inGradingRuns = settings.aiConfig.grading.runs.some(r => r.model === slug);
      const isTitleModel = settings.aiConfig.titleGeneration.model === slug;

      if (inGradingRuns || isTitleModel) {
        const usage = inGradingRuns && isTitleModel
          ? 'grading and title generation'
          : inGradingRuns
            ? 'grading'
            : 'title generation';
        throw new Error(`Cannot remove "${model.name}" - it's currently configured for ${usage}`);
      }
    }

    await ctx.db.delete(model._id);

    // Log audit entry
    await ctx.db.insert('adminAuditLog', {
      action: 'model_removed',
      performedBy: admin.userId,
      performedByEmail: admin.email,
      changes: {
        field: 'modelCatalog',
        previousValue: slug,
      },
      metadata: {
        modelSlug: slug,
        modelName: model.name,
        provider: model.provider,
      },
    });

    return { success: true };
  },
});

/**
 * Toggle a model's enabled status
 */
export const toggleModelEnabled = mutation({
  args: {
    slug: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, { slug, enabled }) => {
    const admin = await requireAdmin(ctx);

    const model = await ctx.db
      .query('modelCatalog')
      .withIndex('by_slug', q => q.eq('slug', slug))
      .unique();

    if (!model) {
      throw new Error(`Model "${slug}" not found in catalog`);
    }

    await ctx.db.patch(model._id, { enabled });

    // Log audit entry
    await ctx.db.insert('adminAuditLog', {
      action: enabled ? 'model_enabled' : 'model_disabled',
      performedBy: admin.userId,
      performedByEmail: admin.email,
      changes: {
        field: 'modelCatalog.enabled',
        previousValue: model.enabled,
        newValue: enabled,
      },
      metadata: {
        modelSlug: slug,
        modelName: model.name,
      },
    });

    return { success: true };
  },
});

/**
 * Get all models in catalog (for admin management)
 */
export const getModelCatalog = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const models = await ctx.db.query('modelCatalog').take(100);

    // Sort by provider then name
    return models.sort((a, b) => {
      const providerCompare = a.provider.localeCompare(b.provider);
      if (providerCompare !== 0) {
        return providerCompare;
      }
      return a.name.localeCompare(b.name);
    });
  },
});
