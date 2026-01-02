// Grade Failure Tracking
// Internal-only error persistence for debugging
// Never exposed to users - raw error details stored here

import { v } from 'convex/values';

import { internalMutation, internalQuery } from './_generated/server';

/**
 * Record a grading failure with full error details (internal only)
 * Called by grading action when processing fails
 */
export const record = internalMutation({
  args: {
    gradeId: v.id('grades'),
    userId: v.optional(v.id('users')),
    rawMessage: v.string(),
    stack: v.optional(v.string()),
  },
  handler: async (ctx, { gradeId, userId, rawMessage, stack }) => {
    await ctx.db.insert('gradeFailures', {
      gradeId,
      userId,
      rawMessage,
      stack,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get failure details for a grade (internal query for debugging)
 * Used by admins/developers to investigate failures
 */
export const getByGradeId = internalQuery({
  args: { gradeId: v.id('grades') },
  handler: async (ctx, { gradeId }) => {
    return await ctx.db
      .query('gradeFailures')
      .withIndex('by_grade_id', q => q.eq('gradeId', gradeId))
      .first();
  },
});
