// Essay queries and mutations
// Handles drafts, submission, and essay management

import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalQuery, mutation, query } from './_generated/server';
import { reserveCreditForUser } from './credits';
import { requireAuth } from './lib/auth';
// Import validators from schema.ts (single source of truth)
import { academicLevelValidator, rubricValidator } from './schema';

const GRADING_COST = '1.00';
const MIN_WORD_COUNT = 50;
const MAX_WORD_COUNT = 50000;

/**
 * Get the current user's draft essay
 */
export const getDraft = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const draft = await ctx.db
      .query('essays')
      .withIndex('by_user_status', q =>
        q.eq('userId', userId).eq('status', 'draft'))
      .filter(q => q.eq(q.field('deletedAt'), undefined))
      .first();

    return draft;
  },
});

/**
 * Get an essay by ID
 */
export const getById = query({
  args: { id: v.id('essays') },
  handler: async (ctx, { id }) => {
    const userId = await requireAuth(ctx);
    const essay = await ctx.db.get(id);

    if (!essay || essay.userId !== userId) {
      return null;
    }

    return essay;
  },
});

/**
 * Save draft (create or update)
 * Used by autosave
 */
export const saveDraft = mutation({
  args: {
    assignmentBrief: v.optional(
      v.object({
        title: v.optional(v.string()),
        instructions: v.optional(v.string()),
        subject: v.optional(v.string()),
        academicLevel: v.optional(academicLevelValidator),
      }),
    ),
    rubric: v.optional(rubricValidator),
    content: v.optional(v.string()),
    focusAreas: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Find existing draft
    const existingDraft = await ctx.db
      .query('essays')
      .withIndex('by_user_status', q =>
        q.eq('userId', userId).eq('status', 'draft'))
      .filter(q => q.eq(q.field('deletedAt'), undefined))
      .first();

    // Calculate word count if content provided
    const wordCount = args.content
      ? args.content
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 0).length
      : undefined;

    if (existingDraft) {
      // Update existing draft
      await ctx.db.patch(existingDraft._id, {
        ...(args.assignmentBrief && {
          assignmentBrief: {
            ...existingDraft.assignmentBrief,
            ...args.assignmentBrief,
          } as {
            title: string;
            instructions: string;
            subject: string;
            academicLevel: 'high_school' | 'undergraduate' | 'postgraduate';
          },
        }),
        ...(args.rubric && { rubric: args.rubric }),
        ...(args.content !== undefined && { content: args.content }),
        ...(args.focusAreas && { focusAreas: args.focusAreas }),
        ...(wordCount !== undefined && { wordCount }),
      });

      return existingDraft._id;
    }

    // Create new draft
    const essayId = await ctx.db.insert('essays', {
      userId,
      status: 'draft',
      ...(args.assignmentBrief && {
        assignmentBrief: args.assignmentBrief as {
          title: string;
          instructions: string;
          subject: string;
          academicLevel: 'high_school' | 'undergraduate' | 'postgraduate';
        },
      }),
      ...(args.rubric && { rubric: args.rubric }),
      ...(args.content && { content: args.content }),
      ...(args.focusAreas && { focusAreas: args.focusAreas }),
      ...(wordCount !== undefined && { wordCount }),
    });

    return essayId;
  },
});

/**
 * Submit an essay for grading
 * Atomic operation: validate, reserve credit, create grade, schedule grading
 */
export const submit = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    // 1. Get the draft
    const draft = await ctx.db
      .query('essays')
      .withIndex('by_user_status', q =>
        q.eq('userId', userId).eq('status', 'draft'))
      .filter(q => q.eq(q.field('deletedAt'), undefined))
      .first();

    if (!draft) {
      throw new Error('No draft found to submit');
    }

    // 2. Validate required fields
    const errors: string[] = [];
    const brief = draft.assignmentBrief;

    if (!brief?.title) {
      errors.push('Title is required');
    }
    if (!brief?.instructions) {
      errors.push('Instructions are required');
    }
    if (!brief?.subject) {
      errors.push('Subject is required');
    }
    if (!draft.content) {
      errors.push('Essay content is required');
    }

    const wordCount = draft.content
      ? draft.content
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 0).length
      : 0;

    if (wordCount < MIN_WORD_COUNT) {
      errors.push(
        `Essay must be at least ${MIN_WORD_COUNT} words. Current: ${wordCount} words`,
      );
    }
    if (wordCount > MAX_WORD_COUNT) {
      errors.push(
        `Essay exceeds ${MAX_WORD_COUNT} word limit. Current: ${wordCount} words`,
      );
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // 3. Reserve credit (validates balance, deducts, tracks in reserved)
    // Uses centralized helper from credits.ts (single source of truth)
    await reserveCreditForUser(ctx, userId, GRADING_COST);

    // 4. Update essay status
    await ctx.db.patch(draft._id, {
      status: 'submitted',
      submittedAt: Date.now(),
      wordCount,
    });

    // 5. Create grade record
    const gradeId = await ctx.db.insert('grades', {
      userId,
      essayId: draft._id,
      status: 'queued',
      queuedAt: Date.now(),
    });

    // 6. Schedule grading action
    await ctx.scheduler.runAfter(0, internal.grading.processGrade, {
      gradeId,
    });

    return { essayId: draft._id, gradeId };
  },
});

/**
 * List submitted essays (paginated) with their latest grade
 */
export const list = query({
  args: {
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const page = args.page ?? 1;
    const pageSize = args.pageSize ?? 20;
    const MAX_ESSAYS = 1000; // Safety limit for unbounded queries

    // Get submitted essays for this user (with safety limit)
    // Note: Search filtering happens in-memory after collect due to Convex query limitations
    let essays = await ctx.db
      .query('essays')
      .withIndex('by_user_status', q =>
        q.eq('userId', userId).eq('status', 'submitted'))
      .filter(q => q.eq(q.field('deletedAt'), undefined))
      .order('desc')
      .take(MAX_ESSAYS); // Limit to prevent unbounded queries

    // Apply search filter if provided
    if (args.search && args.search.trim()) {
      const searchLower = args.search.toLowerCase();
      essays = essays.filter((essay) => {
        const titleMatch = essay.assignmentBrief?.title
          ?.toLowerCase()
          .includes(searchLower);
        const contentMatch = essay.content?.toLowerCase().includes(searchLower);
        return titleMatch || contentMatch;
      });
    }

    const total = essays.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    // Paginate
    const paginatedEssays = essays.slice(offset, offset + pageSize);

    // Get the latest grade for each essay
    const essaysWithGrades = await Promise.all(
      paginatedEssays.map(async (essay) => {
        const grade = await ctx.db
          .query('grades')
          .withIndex('by_essay_id', q => q.eq('essayId', essay._id))
          .order('desc')
          .first();

        return {
          ...essay,
          grade: grade
            ? {
                _id: grade._id,
                status: grade.status,
                letterGradeRange: grade.letterGradeRange,
              }
            : null,
        };
      }),
    );

    return {
      essays: essaysWithGrades,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  },
});

/**
 * Get recent essays (last 5 submitted) with their latest grade
 */
export const recent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const essays = await ctx.db
      .query('essays')
      .withIndex('by_user_status', q =>
        q.eq('userId', userId).eq('status', 'submitted'))
      .filter(q => q.eq(q.field('deletedAt'), undefined))
      .order('desc')
      .take(5);

    // Get the latest grade for each essay
    const essaysWithGrades = await Promise.all(
      essays.map(async (essay) => {
        const grade = await ctx.db
          .query('grades')
          .withIndex('by_essay_id', q => q.eq('essayId', essay._id))
          .order('desc')
          .first();

        return {
          ...essay,
          grade: grade
            ? {
                _id: grade._id,
                status: grade.status,
                letterGradeRange: grade.letterGradeRange,
              }
            : null,
        };
      }),
    );

    return essaysWithGrades;
  },
});

/**
 * Archive an essay (soft delete)
 */
export const archive = mutation({
  args: { id: v.id('essays') },
  handler: async (ctx, { id }) => {
    const userId = await requireAuth(ctx);
    const essay = await ctx.db.get(id);

    if (!essay || essay.userId !== userId) {
      throw new Error('Essay not found');
    }

    await ctx.db.patch(id, {
      status: 'archived',
      deletedAt: Date.now(),
    });
  },
});

/**
 * Internal query to get essay (for use in grading action)
 */
export const getInternal = internalQuery({
  args: { essayId: v.id('essays') },
  handler: async (ctx, { essayId }) => {
    return await ctx.db.get(essayId);
  },
});
