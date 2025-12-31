// Grade queries and mutations
// Handles grade status and results

import { v } from 'convex/values';

import { internalMutation, internalQuery, query } from './_generated/server';
import { requireAuth } from './lib/auth';
// Import validators from schema.ts (single source of truth)
import {
  feedbackValidator,
  modelResultValidator,
  percentageRangeValidator,
} from './schema';

/**
 * Get a grade by ID with essay context
 * This is the main query for the grade status page
 * Real-time subscription will auto-update when status changes
 */
export const getById = query({
  args: { id: v.id('grades') },
  handler: async (ctx, { id }) => {
    const userId = await requireAuth(ctx);
    const grade = await ctx.db.get(id);

    if (!grade || grade.userId !== userId) {
      return null;
    }

    // Get the associated essay
    const essay = await ctx.db.get(grade.essayId);

    return {
      ...grade,
      essay,
    };
  },
});

/**
 * Get all grades for an essay (for regrading history)
 */
export const getByEssayId = query({
  args: { essayId: v.id('essays') },
  handler: async (ctx, { essayId }) => {
    const userId = await requireAuth(ctx);

    const grades = await ctx.db
      .query('grades')
      .withIndex('by_essay_id', q => q.eq('essayId', essayId))
      .filter(q => q.eq(q.field('userId'), userId))
      .order('desc')
      .collect();

    return grades;
  },
});

/**
 * Create a new grade record (internal mutation)
 * Called when an essay is submitted
 */
export const create = internalMutation({
  args: {
    userId: v.id('users'),
    essayId: v.id('essays'),
  },
  handler: async (ctx, { userId, essayId }) => {
    const gradeId = await ctx.db.insert('grades', {
      userId,
      essayId,
      status: 'queued',
      queuedAt: Date.now(),
    });

    return gradeId;
  },
});

/**
 * Update grade status to processing (internal mutation)
 */
export const startProcessing = internalMutation({
  args: { gradeId: v.id('grades') },
  handler: async (ctx, { gradeId }) => {
    await ctx.db.patch(gradeId, {
      status: 'processing',
      startedAt: Date.now(),
    });
  },
});

/**
 * Complete a grade with results (internal mutation)
 * Called by the grading action on success
 */
export const complete = internalMutation({
  args: {
    gradeId: v.id('grades'),
    letterGradeRange: v.string(),
    percentageRange: percentageRangeValidator,
    feedback: feedbackValidator,
    modelResults: v.array(modelResultValidator),
    totalTokens: v.optional(v.number()),
    apiCost: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { gradeId, ...results } = args;

    await ctx.db.patch(gradeId, {
      status: 'complete',
      ...results,
      completedAt: Date.now(),
    });
  },
});

/**
 * Fail a grade with error (internal mutation)
 * Called by the grading action on failure
 */
export const fail = internalMutation({
  args: {
    gradeId: v.id('grades'),
    errorMessage: v.string(),
  },
  handler: async (ctx, { gradeId, errorMessage }) => {
    await ctx.db.patch(gradeId, {
      status: 'failed',
      errorMessage,
      completedAt: Date.now(),
    });
  },
});

/**
 * Get the latest grade for an essay (for display purposes)
 */
export const getLatestForEssay = query({
  args: { essayId: v.id('essays') },
  handler: async (ctx, { essayId }) => {
    const userId = await requireAuth(ctx);

    const grade = await ctx.db
      .query('grades')
      .withIndex('by_essay_id', q => q.eq('essayId', essayId))
      .filter(q => q.eq(q.field('userId'), userId))
      .order('desc')
      .first();

    return grade;
  },
});

/**
 * Internal query to get grade (for use in grading action)
 */
export const getInternal = internalQuery({
  args: { gradeId: v.id('grades') },
  handler: async (ctx, { gradeId }) => {
    return await ctx.db.get(gradeId);
  },
});
