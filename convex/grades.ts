// Grade queries and mutations
// Handles grade status and results

import { v } from 'convex/values';

import type { Doc } from './_generated/dataModel';
import { internalMutation, internalQuery, query } from './_generated/server';
import { requireAuth } from './lib/auth';
// Import validators from schema.ts (single source of truth)
import {
  categoryScoresValidator,
  feedbackValidator,
  modelResultValidator,
  percentageRangeValidator,
} from './schema';

/**
 * Strip internal cost data from a grade before returning to users
 * Cost information is internal-only (for admin analytics)
 * This prevents confusion and keeps business data private
 */
function stripCostData(grade: Doc<'grades'>) {
  // Destructure to remove apiCost and totalTokens from the returned object
  const { apiCost: _apiCost, totalTokens: _totalTokens, modelResults, ...rest } = grade;

  // Strip cost from each model result if present
  const sanitizedModelResults = modelResults?.map(({ cost: _cost, ...mr }) => mr);

  return {
    ...rest,
    modelResults: sanitizedModelResults,
  };
}

/**
 * Get a grade by ID with essay context
 * This is the main query for the grade status page
 * Real-time subscription will auto-update when status changes
 * Note: Cost data is stripped - internal only (see stripCostData)
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
      ...stripCostData(grade),
      essay,
    };
  },
});

/**
 * Get all grades for an essay (for regrading history)
 * Limited to prevent unbounded queries (shouldn't be many regrades per essay)
 * Note: Cost data is stripped - internal only (see stripCostData)
 */
export const getByEssayId = query({
  args: { essayId: v.id('essays') },
  handler: async (ctx, { essayId }) => {
    const userId = await requireAuth(ctx);
    const MAX_GRADES = 100; // Safety limit for regrading history

    const grades = await ctx.db
      .query('grades')
      .withIndex('by_essay_id', q => q.eq('essayId', essayId))
      .filter(q => q.eq(q.field('userId'), userId))
      .order('desc')
      .take(MAX_GRADES); // Limit to prevent unbounded queries

    return grades.map(stripCostData);
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
    percentageRange: percentageRangeValidator,
    feedback: feedbackValidator,
    categoryScores: v.optional(categoryScoresValidator),
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
 * Note: Cost data is stripped - internal only (see stripCostData)
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

    return grade ? stripCostData(grade) : null;
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
