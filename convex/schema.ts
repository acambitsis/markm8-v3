// MarkM8 v3 Convex Schema
// Document-based schema for Convex database
// Exports validators and inferred types for use across the codebase

import { defineSchema, defineTable } from 'convex/server';
import type { Infer } from 'convex/values';
import { v } from 'convex/values';

// =============================================================================
// Validators for reusable types (exported for type inference)
// =============================================================================

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
  v.literal('admin_adjustment'),
);

export const auditActionValidator = v.union(
  v.literal('pricing_update'),
  v.literal('signup_bonus_update'),
  v.literal('admin_email_added'),
  v.literal('admin_email_removed'),
  v.literal('ai_config_update'),
  v.literal('model_added'),
  v.literal('model_removed'),
  v.literal('model_enabled'),
  v.literal('model_disabled'),
);

export const academicLevelValidator = v.union(
  v.literal('high_school'),
  v.literal('undergraduate'),
  v.literal('postgraduate'),
  v.literal('professional'),
);

// =============================================================================
// Complex object validators
// =============================================================================

export const assignmentBriefValidator = v.object({
  title: v.string(),
  instructions: v.string(), // Default provided if user doesn't supply
  subject: v.string(),
  academicLevel: academicLevelValidator, // Pulled from user profile at submit
});

export const rubricValidator = v.object({
  customCriteria: v.optional(v.string()),
  focusAreas: v.optional(v.array(v.string())),
});

export const percentageRangeValidator = v.object({
  lower: v.number(),
  upper: v.number(),
});

// =============================================================================
// AI Grading Output Validators
// These validators define the structure for AI-generated grade feedback.
// They are the single source of truth - convex/lib/gradeSchema.ts derives
// the AI SDK schema from these validators at runtime.
// =============================================================================

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
  durationMs: v.optional(v.number()), // Time taken for this model's grading run
  cost: v.optional(v.string()), // API cost for this run (dollars as string, e.g., "0.0123")
});

// =============================================================================
// Topic Insights Validators (for waiting experience)
// Non-evaluative content returned by action (not persisted)
// =============================================================================

export const essayObservationValidator = v.object({
  stage: v.string(), // Process label: "Identifying your thesis", "Analyzing your structure"
  quote: v.string(), // Exact excerpt from their essay (10-15 words)
  note: v.string(), // What we observe (non-evaluative, 8-12 words)
});

export const essayObservationsValidator = v.object({
  observations: v.array(essayObservationValidator), // 5-6 observations showing essay understanding
});

export const categoryScoresValidator = v.object({
  contentUnderstanding: v.number(),
  structureOrganization: v.number(),
  criticalAnalysis: v.number(),
  languageStyle: v.number(),
  citationsReferences: v.optional(v.number()),
});

// =============================================================================
// Model Catalog Validators
// =============================================================================

export const modelCapabilityValidator = v.union(
  v.literal('grading'),
  v.literal('title'),
  v.literal('synthesis'),
);

export const REASONING_EFFORT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'xhigh', label: 'Extra High' },
] as const;

export const reasoningEffortValidator = v.union(
  v.literal('none'),
  v.literal('minimal'),
  v.literal('low'),
  v.literal('medium'),
  v.literal('high'),
  v.literal('xhigh'),
);

export const modelCatalogEntryValidator = v.object({
  slug: v.string(), // OpenRouter model ID, e.g., "x-ai/grok-4.1-fast"
  name: v.string(), // Display name, e.g., "Grok 4.1"
  provider: v.string(), // Provider name, e.g., "xAI"
  enabled: v.boolean(), // Whether model is available for selection
  capabilities: v.array(modelCapabilityValidator), // Which features can use this model
  contextLength: v.optional(v.number()), // Max context window
  // Reasoning support
  supportsReasoning: v.optional(v.boolean()), // Model can use reasoning
  reasoningRequired: v.optional(v.boolean()), // Reasoning is mandatory
  defaultReasoningEffort: v.optional(reasoningEffortValidator), // Default effort level
  // Deprecated fields (kept for backwards compatibility with existing data)
  lastSyncedAt: v.optional(v.number()),
  pricingInputPer1M: v.optional(v.number()),
  pricingOutputPer1M: v.optional(v.number()),
});

// =============================================================================
// AI Configuration Validators
// =============================================================================

export const gradingModeValidator = v.union(
  v.literal('mock'),
  v.literal('live'),
);

export const gradingRunValidator = v.object({
  model: v.string(), // OpenRouter model ID, e.g., "x-ai/grok-4.1-fast"
  reasoningEffort: v.optional(reasoningEffortValidator), // Reasoning effort for models that support it
});

export const retryConfigValidator = v.object({
  maxRetries: v.number(),
  backoffMs: v.array(v.number()),
});

export const gradingConfigValidator = v.object({
  mode: gradingModeValidator,
  temperature: v.number(), // 0.0-1.0, recommend 0.3-0.5 for consistent grading
  runs: v.array(gradingRunValidator), // 1-10 runs, each with its own model
  outlierThresholdPercent: v.number(), // Deviation threshold for outlier detection
  retry: retryConfigValidator,
  maxTokens: v.optional(v.number()), // Max output tokens for AI response
});

export const titleGenerationConfigValidator = v.object({
  model: v.string(), // OpenRouter model ID
  temperature: v.number(),
  maxTokens: v.number(),
});

export const synthesisConfigValidator = v.object({
  enabled: v.boolean(), // Whether to use LLM synthesis or fallback to lowest-scorer
  model: v.string(), // OpenRouter model ID for synthesis
  temperature: v.number(), // Recommend 0.3 for consistent synthesis
  maxTokens: v.number(), // Max output tokens (typically 2048)
});

export const aiConfigValidator = v.object({
  grading: gradingConfigValidator,
  titleGeneration: titleGenerationConfigValidator,
  synthesis: v.optional(synthesisConfigValidator),
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
    academicLevel: v.optional(academicLevelValidator), // User's default academic level
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_email', ['email']),

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
    // Admin adjustment fields
    adminNote: v.optional(v.string()), // Required for admin_adjustment (min 10 chars)
    performedBy: v.optional(v.id('users')), // Admin who performed the action
  })
    .index('by_user_id', ['userId'])
    .index('by_stripe_payment_intent_id', ['stripePaymentIntentId']),

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

    // Calibration data (actual grade received from teacher)
    actualGrade: v.optional(v.string()), // Free text: "A+", "85%", "7/10"
    actualFeedback: v.optional(v.string()), // Teacher's feedback
    actualGradeAddedAt: v.optional(v.number()), // Timestamp when added
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
    // Note: letterGradeRange is deprecated but kept for backward compatibility with existing data
    letterGradeRange: v.optional(v.string()),
    percentageRange: v.optional(percentageRangeValidator),
    feedback: v.optional(feedbackValidator),
    categoryScores: v.optional(categoryScoresValidator),
    modelResults: v.optional(v.array(modelResultValidator)),

    // Cost tracking
    totalTokens: v.optional(v.number()),
    apiCost: v.optional(v.string()), // Decimal as string

    // Prompt versioning (for traceability)
    promptVersion: v.optional(v.string()),
    synthesisPromptVersion: v.optional(v.string()),

    // Error handling
    errorMessage: v.optional(v.string()),

    // Progress tracking (for real-time UI updates)
    runProgress: v.optional(v.array(v.object({
      model: v.string(),
      status: v.union(v.literal('pending'), v.literal('complete'), v.literal('failed')),
      completedAt: v.optional(v.number()),
    }))),
    synthesisStatus: v.optional(v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('complete'),
      v.literal('skipped'),
      v.literal('failed'),
    )),
    synthesized: v.optional(v.boolean()), // Whether feedback was synthesized (false = fallback)
    synthesisCost: v.optional(v.string()), // Synthesis API cost (decimal as string)
    synthesisDurationMs: v.optional(v.number()), // Time taken for synthesis

    // Timing (Unix timestamps in ms)
    queuedAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index('by_user_id', ['userId'])
    .index('by_essay_id', ['essayId'])
    .index('by_status', ['status'])
    .index('by_user_status', ['userId', 'status']),

  // Platform Settings (singleton for admin-configurable values)
  platformSettings: defineTable({
    key: v.literal('singleton'), // Only one row
    signupBonusAmount: v.string(), // Decimal as string (e.g., "1.00")
    gradingCostPerEssay: v.string(), // Credits charged per essay (e.g., "1.00")
    creditsPerDollar: v.string(), // Credits received per £1 spent (field name kept for backwards compatibility)
    updatedBy: v.optional(v.id('users')), // Admin who made the change

    // Admin access control (email allowlist)
    adminEmails: v.optional(v.array(v.string())), // Email addresses with admin access

    // AI Model Configuration (admin-configurable)
    // Required field - use seed script to initialize: npx convex run seed/platformSettings:seed
    aiConfig: aiConfigValidator,
  }).index('by_key', ['key']),

  // Model Catalog (available AI models from OpenRouter)
  // Seed with: npx convex run seed/modelCatalog:seed
  // View pricing: https://openrouter.ai/models
  modelCatalog: defineTable({
    slug: v.string(), // OpenRouter model ID, e.g., "x-ai/grok-4.1-fast"
    name: v.string(), // Display name, e.g., "Grok 4.1"
    provider: v.string(), // Provider name, e.g., "xAI"
    enabled: v.boolean(), // Whether model is available for selection
    capabilities: v.array(modelCapabilityValidator), // Which features can use this model
    contextLength: v.optional(v.number()), // Max context window
    // Reasoning support
    supportsReasoning: v.optional(v.boolean()), // Model can use reasoning
    reasoningRequired: v.optional(v.boolean()), // Reasoning is mandatory
    defaultReasoningEffort: v.optional(reasoningEffortValidator), // Default effort level
    // Deprecated fields (kept for backwards compatibility with existing data)
    lastSyncedAt: v.optional(v.number()),
    pricingInputPer1M: v.optional(v.number()),
    pricingOutputPer1M: v.optional(v.number()),
  })
    .index('by_slug', ['slug'])
    .index('by_enabled', ['enabled'])
    .index('by_provider', ['provider']),

  // Grade Failures (internal-only error tracking for debugging)
  // Raw error details stored here, never exposed to users
  gradeFailures: defineTable({
    gradeId: v.id('grades'),
    userId: v.optional(v.id('users')), // Optional in case grade cannot be loaded
    rawMessage: v.string(), // Full error message from provider/exception
    stack: v.optional(v.string()), // Stack trace if available
    createdAt: v.number(), // Unix timestamp in ms
  })
    .index('by_grade_id', ['gradeId'])
    .index('by_user_id', ['userId']),

  // Document Parse Requests (rate limiting for file uploads)
  // Tracks recent parse requests per user for rate limiting (10/min)
  documentParseRequests: defineTable({
    userId: v.id('users'),
    timestamp: v.number(), // Unix timestamp in ms
  })
    .index('by_user_timestamp', ['userId', 'timestamp']),

  // Admin Audit Log (tracks all admin settings changes)
  adminAuditLog: defineTable({
    action: auditActionValidator,
    performedBy: v.id('users'),
    performedByEmail: v.string(), // Denormalized for display
    changes: v.object({
      field: v.string(),
      previousValue: v.optional(v.any()),
      newValue: v.optional(v.any()),
    }),
    metadata: v.optional(v.object({
      targetEmail: v.optional(v.string()), // For email add/remove
      modelSlug: v.optional(v.string()), // For model add/remove/toggle
      modelName: v.optional(v.string()), // For model add/remove/toggle
      provider: v.optional(v.string()), // For model add
    })),
  })
    .index('by_action', ['action'])
    .index('by_performed_by', ['performedBy']),
});

// =============================================================================
// Inferred Types (for use in UI components - single source of truth)
// =============================================================================

export type EssayStatus = Infer<typeof essayStatusValidator>;
export type GradeStatus = Infer<typeof gradeStatusValidator>;
export type TransactionType = Infer<typeof transactionTypeValidator>;
export type AuditAction = Infer<typeof auditActionValidator>;
export type AcademicLevel = Infer<typeof academicLevelValidator>;

export type AssignmentBrief = Infer<typeof assignmentBriefValidator>;
export type Rubric = Infer<typeof rubricValidator>;
export type PercentageRange = Infer<typeof percentageRangeValidator>;
export type GradeFeedback = Infer<typeof feedbackValidator>;
export type CategoryScores = Infer<typeof categoryScoresValidator>;
export type ModelResult = Infer<typeof modelResultValidator>;

// Model Catalog Types
export type ModelCapability = Infer<typeof modelCapabilityValidator>;
export type ModelCatalogEntry = Infer<typeof modelCatalogEntryValidator>;
export type ReasoningEffort = Infer<typeof reasoningEffortValidator>;

// AI Configuration Types
export type GradingMode = Infer<typeof gradingModeValidator>;
export type GradingRun = Infer<typeof gradingRunValidator>;
export type RetryConfig = Infer<typeof retryConfigValidator>;
export type GradingConfig = Infer<typeof gradingConfigValidator>;
export type TitleGenerationConfig = Infer<typeof titleGenerationConfigValidator>;
export type SynthesisConfig = Infer<typeof synthesisConfigValidator>;
export type AiConfig = Infer<typeof aiConfigValidator>;

// Essay Observation Types (for waiting experience)
export type EssayObservation = Infer<typeof essayObservationValidator>;
export type EssayObservations = Infer<typeof essayObservationsValidator>;
