// MarkM8 v3 Database Schema
// Forward-compatible design: nullable organizationId columns for future v3.1+ org support
// See PHASE_2_MIGRATION.md for organization migration plan

import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// =============================================================================
// Enums
// =============================================================================

export const essayStatusEnum = pgEnum('essay_status', ['draft', 'submitted', 'archived']);
export const gradeStatusEnum = pgEnum('grade_status', ['queued', 'processing', 'complete', 'failed']);
export const transactionTypeEnum = pgEnum('transaction_type', ['signup_bonus', 'purchase', 'grading', 'refund']);
export const gradingScaleEnum = pgEnum('grading_scale', ['percentage', 'letter', 'uk', 'gpa', 'pass_fail']);

// =============================================================================
// Users (synced from Clerk)
// =============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Matches Clerk user ID (e.g., 'user_2abc123def456')
  clerkId: text('clerk_id').notNull().unique(), // Redundant with id, kept for explicit clarity
  email: text('email').notNull(),
  name: text('name'),
  imageUrl: text('image_url'),
  institution: text('institution'), // Optional: user's institution (free text)
  course: text('course'), // Optional: user's course (free text)
  defaultGradingScale: gradingScaleEnum('default_grading_scale'), // User's preferred grading scale
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// Platform Settings (singleton table for admin-configurable values)
// =============================================================================

export const platformSettings = pgTable('platform_settings', {
  id: text('id').primaryKey().default('singleton'), // Only one row
  signupBonusAmount: numeric('signup_bonus_amount', { precision: 10, scale: 2 }).default('1.00').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: text('updated_by'), // Admin user ID who made the change
});

// =============================================================================
// Credits (user-scoped, with forward-compatible org support)
// =============================================================================

export const credits = pgTable('credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  // FUTURE (v3.1+): organizationId for org credit pools
  // organizationId: uuid('organization_id'), // No FK yet - orgs table doesn't exist
  balance: numeric('balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  reserved: numeric('reserved', { precision: 10, scale: 2 }).default('0.00').notNull(), // Credits reserved for pending grading
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// Credit Transactions (audit log, with forward-compatible org support)
// =============================================================================

export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  // FUTURE (v3.1+): organizationId for org credit transactions
  // organizationId: uuid('organization_id'), // No FK yet - orgs table doesn't exist
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  transactionType: transactionTypeEnum('transaction_type').notNull(),
  description: text('description'),
  gradeId: uuid('grade_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => ({
  userIdIdx: index('idx_credit_transactions_user_id').on(table.userId),
  createdAtIdx: index('idx_credit_transactions_created_at').on(table.createdAt.desc()),
}));

// =============================================================================
// Essays (user-scoped, with forward-compatible org support)
// =============================================================================

export const essays = pgTable('essays', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Polymorphic ownership (for v3: userId is always set, organizationId is always NULL)
  // FUTURE (v3.1+): Either userId OR organizationId set (not both) - see PHASE_2_MIGRATION.md
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  // organizationId: uuid('organization_id'), // FUTURE: No FK yet - orgs table doesn't exist

  // Who submitted it (for v3: same as userId; for v3.1+ org essays: tracks the actual author)
  authorUserId: text('author_user_id').references(() => users.id, { onDelete: 'set null' }),

  // Essay data (nullable for drafts)
  assignmentBrief: jsonb('assignment_brief').$type<AssignmentBrief>(), // { title, instructions, subject, academicLevel }
  rubric: jsonb('rubric').$type<Rubric>(),
  content: text('content'),
  wordCount: integer('word_count'),
  focusAreas: text('focus_areas').array(),

  // Lifecycle
  status: essayStatusEnum('status').notNull().default('draft'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  submittedAt: timestamp('submitted_at'),
  deletedAt: timestamp('deleted_at'), // Soft delete
}, table => ({
  userIdIdx: index('idx_essays_user_id').on(table.userId),
  statusIdx: index('idx_essays_status').on(table.status),
  submittedAtIdx: index('idx_essays_submitted_at').on(table.submittedAt.desc()),
  // Partial index for fast draft lookup
  draftIdx: index('idx_essays_user_draft').on(table.userId, table.updatedAt).where(sql`status = 'draft'`),
  // Note: Unique partial index for "one draft per user" requires raw SQL migration:
  // CREATE UNIQUE INDEX idx_essays_user_draft_unique ON essays(user_id) WHERE status = 'draft';
}));

// =============================================================================
// Grades (user-scoped, 1-to-many with essays for regrading support)
// =============================================================================

export const grades = pgTable('grades', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  essayId: uuid('essay_id').references(() => essays.id, { onDelete: 'cascade' }).notNull(), // NOT unique (regrading)
  // FUTURE (v3.1+): organizationId for org-owned grades
  // organizationId: uuid('organization_id'), // No FK yet - orgs table doesn't exist

  // Grading status
  status: gradeStatusEnum('status').notNull().default('queued'),

  // Results (populated when status = 'complete')
  letterGradeRange: text('letter_grade_range'), // "A" or "A-B"
  percentageRange: jsonb('percentage_range').$type<PercentageRange>(), // { lower: 85, upper: 92 }
  feedback: jsonb('feedback').$type<GradeFeedback>(), // Full feedback structure
  modelResults: jsonb('model_results').$type<ModelResult[]>(), // [{ model, percentage, included, reason }]

  // Cost tracking
  totalTokens: integer('total_tokens').default(0),
  apiCost: numeric('api_cost', { precision: 10, scale: 4 }),

  // Error handling
  errorMessage: text('error_message'),

  // Timing
  queuedAt: timestamp('queued_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, table => ({
  userIdIdx: index('idx_grades_user_id').on(table.userId),
  statusIdx: index('idx_grades_status').on(table.status),
  essayIdIdx: index('idx_grades_essay_id').on(table.essayId),
  essayCreatedIdx: index('idx_grades_essay_created').on(table.essayId, table.createdAt.desc()),
}));

// =============================================================================
// Type Definitions for JSONB Fields
// =============================================================================

export type AssignmentBrief = {
  title: string;
  instructions: string;
  subject: string;
  academicLevel: 'high_school' | 'undergraduate' | 'postgraduate';
};

export type Rubric = {
  customCriteria?: string;
  focusAreas?: string[];
};

export type PercentageRange = {
  lower: number;
  upper: number;
};

export type GradeFeedback = {
  strengths: Array<{
    title: string;
    description: string;
    evidence?: string;
  }>;
  improvements: Array<{
    title: string;
    description: string;
    suggestion: string;
    detailedSuggestions?: string[];
  }>;
  languageTips: Array<{
    category: string;
    feedback: string;
  }>;
  resources?: Array<{
    title: string;
    url?: string;
    description: string;
  }>;
};

export type ModelResult = {
  model: string;
  percentage: number;
  included: boolean;
  reason?: string;
};

export type CategoryScores = {
  contentUnderstanding: number;
  structureOrganization: number;
  criticalAnalysis: number;
  languageStyle: number;
  citationsReferences?: number;
};
