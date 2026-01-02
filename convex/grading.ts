// AI Grading Action
// Background job that processes essay grading

import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
// Import types from schema (single source of truth)
import type { GradeFeedback, ModelResult, PercentageRange } from './schema';

const GRADING_COST = '1.00';

type GradingEnsembleMode = 'mock' | 'live';

/**
 * Grading ensemble configuration.
 *
 * Priority order (highest to lowest):
 * 1. Environment variables (MARKM8_GRADING_*) - for emergency/testing overrides
 * 2. Testing config (if testing.enabled === true) - from platformSettings.aiConfig.testing.grading
 * 3. Production config - from platformSettings.aiConfig.grading
 * 4. Hardcoded defaults - fallback if config missing
 *
 * Today, we only implement `mock` grading results. The shape and selection logic
 * is already generalized so we can:
 * - run 3, 4, or 5 parallel grading runs
 * - use a single model for all runs, or specify per-run models (mixed models)
 * - swap in cheap/fast models for testing (via testing config override)
 *
 * Env vars (Convex action runtime) - HIGHEST PRIORITY:
 * - `MARKM8_GRADING_MODE`: 'mock' | 'live' (default 'mock')
 * - `MARKM8_GRADING_MODELS`: comma-separated list of models for each run
 *    - Example: "x-ai/grok-4.1,x-ai/grok-4.1,google/gemini-3"
 * - `MARKM8_GRADING_RUNS`: number of runs if MODELS not provided (default 3)
 *
 * Note: 'live' is reserved for future OpenRouter/Vercel AI SDK integration.
 * TODO: Read from platformSettings.aiConfig when full implementation is ready.
 */
function getGradingEnsembleConfig(): {
  mode: GradingEnsembleMode;
  runModels: string[];
} {
  // Priority 1: Environment variables (highest priority, for emergency/testing)
  const rawMode = (process.env.MARKM8_GRADING_MODE ?? 'mock').toLowerCase();
  const mode: GradingEnsembleMode = rawMode === 'live' ? 'live' : 'mock';

  const modelsFromEnv = (process.env.MARKM8_GRADING_MODELS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const runsFromEnv = Number.parseInt(process.env.MARKM8_GRADING_RUNS ?? '', 10);
  const runs = Number.isFinite(runsFromEnv) ? runsFromEnv : 3;

  const desiredRuns = Math.min(5, Math.max(3, runs));

  // If env vars provided, use them (highest priority)
  if (modelsFromEnv.length >= 1) {
    // Clamp to 3..5 by truncating or padding with the first model.
    const clamped = modelsFromEnv.slice(0, 5);
    while (clamped.length < 3) {
      clamped.push(clamped[0]!);
    }
    return { mode, runModels: clamped };
  }

  // Priority 2 & 3: TODO - Read from platformSettings.aiConfig
  // const aiConfig = await ctx.runQuery(internal.platformSettings.getAiConfig, {});
  // if (aiConfig?.testing?.enabled && aiConfig.testing.grading) {
  //   // Use testing config (allows fast variants)
  //   return { mode, runModels: aiConfig.testing.grading.runs.map(r => r.model) };
  // }
  // if (aiConfig?.grading) {
  //   // Use production config (full models only)
  //   return { mode, runModels: aiConfig.grading.runs.map(r => r.model) };
  // }

  // Priority 4: Hardcoded defaults (fallback)
  // Default: 3 runs, all x-ai/grok-4.1 (matches previous behavior, but configurable).
  return { mode, runModels: Array.from({ length: desiredRuns }, () => 'x-ai/grok-4.1') };
}

function clampPercentage(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/**
 * Generate mock grading results for testing
 * TODO: Replace with actual AI grading when OpenRouter is configured
 */
function generateMockGrade(runModels: string[]): {
  letterGradeRange: string;
  percentageRange: PercentageRange;
  feedback: GradeFeedback;
  modelResults: ModelResult[];
} {
  // Generate random percentage between 70-95
  const basePercentage = Math.floor(Math.random() * 26) + 70;
  const lowerBound = Math.max(0, basePercentage - 3);
  const upperBound = Math.min(100, basePercentage + 3);

  // Small per-run variation to mimic model variance.
  const centerIndex = Math.floor(runModels.length / 2);
  const deviations = runModels.map((_, i) => (i - centerIndex) * 2);

  return {
    letterGradeRange:
      basePercentage >= 90 ? 'A' : basePercentage >= 80 ? 'B' : 'C',
    percentageRange: {
      lower: lowerBound,
      upper: upperBound,
    },
    feedback: {
      strengths: [
        {
          title: 'Clear Structure',
          description:
            'Your essay follows a logical progression with well-defined sections.',
          evidence:
            'The introduction clearly sets up the thesis and each paragraph builds on the previous.',
        },
        {
          title: 'Strong Evidence',
          description:
            'You support your arguments with relevant examples and citations.',
          evidence:
            'Multiple references to primary and secondary sources strengthen your analysis.',
        },
        {
          title: 'Engaging Writing Style',
          description:
            'Your prose is readable and maintains reader interest throughout.',
        },
      ],
      improvements: [
        {
          title: 'Transition Clarity',
          description: 'Some paragraph transitions could be smoother.',
          suggestion:
            'Use transitional phrases to connect ideas between paragraphs.',
          detailedSuggestions: [
            'Add "Furthermore" or "In addition" when introducing supporting points',
            'Use "However" or "Conversely" for contrasting ideas',
            'Reference previous paragraphs: "Building on this point..."',
          ],
        },
        {
          title: 'Conclusion Depth',
          description:
            'The conclusion could more effectively synthesize your arguments.',
          suggestion:
            'Rather than summarizing, show how your points connect to form a larger insight.',
        },
      ],
      languageTips: [
        {
          category: 'Academic Tone',
          feedback:
            'Consider avoiding contractions in formal academic writing.',
        },
        {
          category: 'Vocabulary',
          feedback: 'Vary your word choice to avoid repetition of key terms.',
        },
      ],
      resources: [
        {
          title: 'Purdue OWL - Transitions',
          url: 'https://owl.purdue.edu/owl/general_writing/mechanics/transitions_and_transitional_devices/',
          description:
            'Comprehensive guide on using transitional phrases effectively.',
        },
      ],
    },
    modelResults: runModels.map((model, i) => ({
      model,
      percentage: clampPercentage(basePercentage + deviations[i]!),
      included: true,
    })),
  };
}

/**
 * Process a grade (background action)
 * This is scheduled when an essay is submitted
 */
export const processGrade = internalAction({
  args: { gradeId: v.id('grades') },
  handler: async (ctx, { gradeId }) => {
    try {
      const { mode, runModels } = getGradingEnsembleConfig();

      // 1. Get the grade record
      const grade = await ctx.runQuery(internal.grades.getInternal, {
        gradeId,
      });

      if (!grade) {
        throw new Error('Grade not found');
      }

      // 2. Idempotency check: only process if status is 'queued'
      // Prevents duplicate processing if action is retried or scheduled multiple times
      if (grade.status !== 'queued') {
        // Grade already processed or being processed - skip
        return;
      }

      // 3. Get the essay
      const essay = await ctx.runQuery(internal.essays.getInternal, {
        essayId: grade.essayId,
      });

      if (!essay) {
        throw new Error('Essay not found');
      }

      // 4. Update status to processing
      await ctx.runMutation(internal.grades.startProcessing, { gradeId });

      // 5. Simulate processing delay (1-3 seconds)
      await new Promise(resolve =>
        setTimeout(resolve, 1000 + Math.random() * 2000),
      );

      // 6. Generate results
      // TODO: Replace with actual AI grading:
      // - Call OpenRouter API with N runs in parallel (3..5)
      // - Use `runModels` to decide which model each run uses (supports mixed models)
      // - Implement retry logic (3 retries, exponential backoff)
      // - Outlier detection (exclude furthest from mean if >10% deviation)
      const results
        = mode === 'mock'
          ? generateMockGrade(runModels)
          : (() => {
              throw new Error(
                'Live grading mode not implemented yet. Set MARKM8_GRADING_MODE=mock.',
              );
            })();

      // 7. Complete the grade
      await ctx.runMutation(internal.grades.complete, {
        gradeId,
        ...results,
      });

      // 8. Clear credit reservation and record transaction
      await ctx.runMutation(internal.credits.clearReservation, {
        userId: grade.userId,
        amount: GRADING_COST,
        gradeId,
        description: `Grading for essay: ${essay.assignmentBrief?.title ?? 'Untitled'}`,
      });
    } catch (error) {
      // Handle failure
      const errorMessage
        = error instanceof Error ? error.message : 'Unknown error occurred';

      // Try to get the grade to refund
      try {
        const grade = await ctx.runQuery(internal.grades.getInternal, {
          gradeId,
        });

        if (grade) {
          // Fail the grade
          await ctx.runMutation(internal.grades.fail, {
            gradeId,
            errorMessage,
          });

          // Refund the credit
          await ctx.runMutation(internal.credits.refundReservation, {
            userId: grade.userId,
            amount: GRADING_COST,
            gradeId,
            reason: `Grading failed: ${errorMessage}`,
          });
        }
      } catch {
        // Log the error but don't throw
        console.error('Failed to handle grading failure:', error);
      }
    }
  },
});

// Note: Internal queries for getGradeInternal and getEssayInternal
// are defined in their respective files (grades.ts and essays.ts)
