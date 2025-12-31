// MarkM8 v3 Convex Schema
// Document-based schema for Convex database
// Exports validators and inferred types for use across the codebase

import { defineSchema, defineTable } from 'convex/server';
import type { Infer } from 'convex/values';
import { v } from 'convex/values';

// =============================================================================
// Validators for reusable types (exported for type inference)
// =============================================================================

export const gradingScaleValidator = v.union(
  v.literal('percentage'),
  v.literal('letter'),
  v.literal('uk'),
  v.literal('gpa'),
  v.literal('pass_fail'),
);

export const essayStatusValidator = v.union(
  v.literal('draft'),
  v.literal('submitted'),
  v.literal('archived'),
);

export const gradeStatusValidator = v.union(
  v.literal('queued'),
  v.literal('processing'),
  v.literal('complete'),
  v.literal('failed'),
);

export const transactionTypeValidator = v.union(
  v.literal('signup_bonus'),
  v.literal('purchase'),
  v.literal('grading'),
  v.literal('refund'),
);

export const academicLevelValidator = v.union(
  v.literal('high_school'),
  v.literal('undergraduate'),
  v.literal('postgraduate'),
);

// =============================================================================
// Complex object validators
// =============================================================================

export const assignmentBriefValidator = v.object({
  title: v.string(),
  instructions: v.string(),
  subject: v.string(),
  academicLevel: academicLevelValidator,
});

export const rubricValidator = v.object({
  customCriteria: v.optional(v.string()),
  focusAreas: v.optional(v.array(v.string())),
});

export const percentageRangeValidator = v.object({
  lower: v.number(),
  upper: v.number(),
});

export const strengthValidator = v.object({
  title: v.string(),
  description: v.string(),
  evidence: v.optional(v.string()),
});

export const improvementValidator = v.object({
  title: v.string(),
  description: v.string(),
  suggestion: v.string(),
  detailedSuggestions: v.optional(v.array(v.string())),
});

export const languageTipValidator = v.object({
  category: v.string(),
  feedback: v.string(),
});

export const resourceValidator = v.object({
  title: v.string(),
  url: v.optional(v.string()),
  description: v.string(),
});

export const feedbackValidator = v.object({
  strengths: v.array(strengthValidator),
  improvements: v.array(improvementValidator),
  languageTips: v.array(languageTipValidator),
  resources: v.optional(v.array(resourceValidator)),
});

export const modelResultValidator = v.object({
  model: v.string(),
  percentage: v.number(),
  included: v.boolean(),
  reason: v.optional(v.string()),
});

// =============================================================================
// Schema Definition
// =============================================================================

export default defineSchema({
  // Users (synced from Clerk)
  users: defineTable({
    clerkId: v.string(), // Clerk user ID (e.g., 'user_2abc123def456')
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    institution: v.optional(v.string()), // User's institution (free text)
    course: v.optional(v.string()), // User's course (free text)
    defaultGradingScale: v.optional(gradingScaleValidator), // Preferred grading scale
  }).index('by_clerk_id', ['clerkId']),

  // Credits (user-scoped balance tracking)
  credits: defineTable({
    userId: v.id('users'),
    balance: v.string(), // Store as string for decimal precision (e.g., "1.00")
    reserved: v.string(), // Credits reserved for pending grading
  }).index('by_user_id', ['userId']),

  // Credit Transactions (audit log)
  creditTransactions: defineTable({
    userId: v.id('users'),
    amount: v.string(), // Can be negative for deductions
    transactionType: transactionTypeValidator,
    description: v.optional(v.string()),
    gradeId: v.optional(v.id('grades')),
    stripePaymentIntentId: v.optional(v.string()),
  }).index('by_user_id', ['userId']),

  // Essays (user-scoped, drafts and submitted)
  essays: defineTable({
    userId: v.id('users'),
    authorUserId: v.optional(v.id('users')), // For future org support

    // Essay data (optional for drafts)
    assignmentBrief: v.optional(assignmentBriefValidator),
    rubric: v.optional(rubricValidator),
    content: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    focusAreas: v.optional(v.array(v.string())),

    // Lifecycle
    status: essayStatusValidator,
    submittedAt: v.optional(v.number()), // Unix timestamp in ms
    deletedAt: v.optional(v.number()), // Soft delete timestamp
  })
    .index('by_user_id', ['userId'])
    .index('by_user_status', ['userId', 'status'])
    .index('by_user_submitted', ['userId', 'submittedAt']),

  // Grades (user-scoped, 1-to-many with essays for regrading support)
  grades: defineTable({
    userId: v.id('users'),
    essayId: v.id('essays'), // NOT unique (supports regrading)

    // Grading status
    status: gradeStatusValidator,

    // Results (populated when status = 'complete')
    letterGradeRange: v.optional(v.string()), // "A" or "A-B"
    percentageRange: v.optional(percentageRangeValidator),
    feedback: v.optional(feedbackValidator),
    modelResults: v.optional(v.array(modelResultValidator)),

    // Cost tracking
    totalTokens: v.optional(v.number()),
    apiCost: v.optional(v.string()), // Decimal as string

    // Error handling
    errorMessage: v.optional(v.string()),

    // Timing (Unix timestamps in ms)
    queuedAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index('by_user_id', ['userId'])
    .index('by_essay_id', ['essayId'])
    .index('by_status', ['status']),

  // Platform Settings (singleton for admin-configurable values)
  platformSettings: defineTable({
    key: v.literal('singleton'), // Only one row
    signupBonusAmount: v.string(), // Decimal as string (e.g., "1.00")
    updatedBy: v.optional(v.id('users')), // Admin who made the change
  }).index('by_key', ['key']),
});

// =============================================================================
// Inferred Types (for use in UI components - single source of truth)
// =============================================================================

export type GradingScale = Infer<typeof gradingScaleValidator>;
export type EssayStatus = Infer<typeof essayStatusValidator>;
export type GradeStatus = Infer<typeof gradeStatusValidator>;
export type TransactionType = Infer<typeof transactionTypeValidator>;
export type AcademicLevel = Infer<typeof academicLevelValidator>;

export type AssignmentBrief = Infer<typeof assignmentBriefValidator>;
export type Rubric = Infer<typeof rubricValidator>;
export type PercentageRange = Infer<typeof percentageRangeValidator>;
export type GradeFeedback = Infer<typeof feedbackValidator>;
export type ModelResult = Infer<typeof modelResultValidator>;
