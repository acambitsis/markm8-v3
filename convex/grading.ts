// AI Grading Action
// Background job that processes essay grading

import { generateObject } from 'ai';
import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import { getGradingModel } from './lib/ai';
import { buildGradingPrompt } from './lib/gradingPrompt';
import { gradeOutputSchema } from './lib/gradingSchema';
// Import types from schema (single source of truth)
import type {
  CategoryScores,
  GradeFeedback,
  ModelResult,
  PercentageRange,
} from './schema';

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
 * Supports both `mock` (for testing) and `live` (real AI grading) modes.
 * The implementation supports:
 * - 3, 4, or 5 parallel grading runs
 * - Single model for all runs, or per-run models (mixed models)
 * - Outlier detection (excludes scores >10% deviation from mean)
 * - Retry logic with exponential backoff (3 retries: 5s, 15s, 45s)
 * - Error classification (transient vs permanent)
 *
 * Env vars (Convex action runtime) - HIGHEST PRIORITY:
 * - `MARKM8_GRADING_MODE`: 'mock' | 'live' (default 'mock')
 * - `MARKM8_GRADING_MODELS`: comma-separated list of models for each run
 *    - Example: "x-ai/grok-4.1,x-ai/grok-4.1,google/gemini-3"
 * - `MARKM8_GRADING_RUNS`: number of runs if MODELS not provided (default 3)
 *
 * Note: Reading from platformSettings.aiConfig is planned for future enhancement.
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
 * Classify error as transient (retry) or permanent (fail immediately)
 */
function classifyError(error: unknown): {
  isTransient: boolean;
  message: string;
} {
  const message = error instanceof Error ? error.message : String(error);

  // Network/timeout errors - transient
  if (
    message.includes('timeout')
    || message.includes('ECONNRESET')
    || message.includes('ENOTFOUND')
    || message.includes('network')
  ) {
    return { isTransient: true, message };
  }

  // Rate limits - transient
  if (message.includes('rate limit') || message.includes('429')) {
    return { isTransient: true, message };
  }

  // Service unavailable - transient
  if (message.includes('503') || message.includes('service unavailable')) {
    return { isTransient: true, message };
  }

  // API errors (400, 401, 403) - permanent
  if (
    message.includes('400')
    || message.includes('401')
    || message.includes('403')
    || message.includes('invalid')
    || message.includes('unauthorized')
    || message.includes('forbidden')
  ) {
    return { isTransient: false, message };
  }

  // Default: treat as permanent to avoid infinite retries
  return { isTransient: false, message };
}

// User-facing error message (stable, never includes internal details)
const USER_ERROR_MESSAGE = 'Grading failed. You were not charged. Please try again.';

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param backoffMs - Backoff delays in milliseconds (default: [5000, 15000, 45000])
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  backoffMs = [5000, 15000, 45000],
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const { isTransient } = classifyError(error);

      // Don't retry permanent errors
      if (!isTransient) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt >= maxRetries) {
        throw error;
      }

      // Wait before retrying
      const delay = backoffMs[Math.min(attempt, backoffMs.length - 1)] ?? 5000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Detect outliers using "furthest from mean" algorithm
 * Excludes scores that deviate more than threshold% from the mean
 */
function detectOutliers(
  scores: Array<{ model: string; percentage: number }>,
  thresholdPercent = 10,
): Array<{ model: string; percentage: number; included: boolean; reason?: string }> {
  if (scores.length === 0) {
    return [];
  }

  // Calculate mean
  const sum = scores.reduce((acc, s) => acc + s.percentage, 0);
  const mean = sum / scores.length;

  // Handle edge case: if mean is 0 or very close to 0, all scores are the same
  // No outliers possible, so return all scores as included
  if (mean === 0 || Math.abs(mean) < 0.01) {
    return scores.map(score => ({
      ...score,
      included: true,
    }));
  }

  // Calculate deviations from mean
  const deviations = scores.map((score) => {
    const deviation = Math.abs(score.percentage - mean);
    const deviationPercent = (deviation / mean) * 100;
    return {
      ...score,
      deviation,
      deviationPercent,
    };
  });

  // Find maximum deviation
  const maxDeviation = Math.max(...deviations.map(d => d.deviationPercent));

  // If max deviation exceeds threshold, exclude the furthest score
  if (maxDeviation > thresholdPercent) {
    // Find the score with maximum deviation
    const furthestIndex = deviations.findIndex(
      d => d.deviationPercent === maxDeviation,
    );

    return scores.map((score, i) => ({
      model: score.model,
      percentage: score.percentage,
      included: i !== furthestIndex,
      reason:
        i === furthestIndex
          ? `Outlier detected: ${maxDeviation.toFixed(1)}% deviation from mean (${mean.toFixed(1)}%)`
          : undefined,
    }));
  }

  // All scores are within threshold
  return scores.map(score => ({
    ...score,
    included: true,
  }));
}

/**
 * Convert percentage range to letter grade range
 * Handles A-F with +/- and grade ranges
 */
function convertToLetterGrade(
  lower: number,
  upper: number,
): string {
  const letterGrades = [
    { min: 97, letter: 'A+' },
    { min: 93, letter: 'A' },
    { min: 90, letter: 'A-' },
    { min: 87, letter: 'B+' },
    { min: 83, letter: 'B' },
    { min: 80, letter: 'B-' },
    { min: 77, letter: 'C+' },
    { min: 73, letter: 'C' },
    { min: 70, letter: 'C-' },
    { min: 67, letter: 'D+' },
    { min: 63, letter: 'D' },
    { min: 60, letter: 'D-' },
    { min: 0, letter: 'F' },
  ];

  function percentageToLetter(percent: number): string {
    for (const grade of letterGrades) {
      if (percent >= grade.min) {
        return grade.letter;
      }
    }
    return 'F';
  }

  const lowerLetter = percentageToLetter(lower);
  const upperLetter = percentageToLetter(upper);

  // If same letter grade, return single letter
  if (lowerLetter === upperLetter) {
    return lowerLetter;
  }

  // Calculate grade spread (number of letter grades apart)
  const lowerIndex = letterGrades.findIndex(g => g.letter === lowerLetter);
  const upperIndex = letterGrades.findIndex(g => g.letter === upperLetter);
  const spread = Math.abs(upperIndex - lowerIndex);

  // If spread <= 1 grade, use "to" format (e.g., "B to B+")
  if (spread <= 1) {
    return `${lowerLetter} to ${upperLetter}`;
  }

  // If spread > 1, use range format (e.g., "B-C")
  return `${lowerLetter}-${upperLetter}`;
}

/**
 * Generate mock grading results for testing
 */
function generateMockGrade(runModels: string[]): {
  letterGradeRange: string;
  percentageRange: PercentageRange;
  feedback: GradeFeedback;
  categoryScores: CategoryScores;
  modelResults: ModelResult[];
} {
  // Generate random percentage between 70-95
  const basePercentage = Math.floor(Math.random() * 26) + 70;
  const lowerBound = Math.max(0, basePercentage - 3);
  const upperBound = Math.min(100, basePercentage + 3);

  // Small per-run variation to mimic model variance.
  const centerIndex = Math.floor(runModels.length / 2);
  const deviations = runModels.map((_, i) => (i - centerIndex) * 2);

  // Generate category scores aligned with overall percentage
  // Add some variation to make it realistic (scores vary by ±5-10 points)
  const categoryScores: CategoryScores = {
    contentUnderstanding: clampPercentage(
      basePercentage + Math.floor(Math.random() * 11) - 5,
    ),
    structureOrganization: clampPercentage(
      basePercentage + Math.floor(Math.random() * 11) - 5,
    ),
    criticalAnalysis: clampPercentage(
      basePercentage + Math.floor(Math.random() * 11) - 5,
    ),
    languageStyle: clampPercentage(
      basePercentage + Math.floor(Math.random() * 11) - 5,
    ),
    citationsReferences: clampPercentage(
      basePercentage + Math.floor(Math.random() * 11) - 5,
    ),
  };

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
        {
          title: 'Evidence Integration',
          description:
            'Some evidence could be more seamlessly integrated into your argument.',
          suggestion:
            'Use signal phrases to introduce evidence and explain how it supports your thesis.',
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
        {
          category: 'Sentence Structure',
          feedback:
            'Mix simple and complex sentences to create better rhythm and flow.',
        },
      ],
      resources: [
        {
          title: 'Purdue OWL - Transitions',
          url: 'https://owl.purdue.edu/owl/general_writing/mechanics/transitions_and_transitional_devices/',
          description:
            'Comprehensive guide on using transitional phrases effectively.',
        },
        {
          title: 'Purdue OWL - Academic Writing',
          url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/',
          description:
            'Guidelines for academic writing style and conventions.',
        },
      ],
    },
    categoryScores,
    modelResults: runModels.map((model, i) => ({
      model,
      percentage: clampPercentage(basePercentage + deviations[i]!),
      included: true,
    })),
  };
}

/**
 * Run real AI grading with multi-model consensus
 * Executes N parallel AI calls, applies outlier detection, and aggregates results
 */
async function runAIGrading(
  essay: {
    assignmentBrief?: {
      instructions: string;
      academicLevel: 'high_school' | 'undergraduate' | 'postgraduate';
    } | null;
    rubric?: { customCriteria?: string; focusAreas?: string[] } | null;
    focusAreas?: string[];
    content?: string | null;
  },
  runModels: string[],
): Promise<{
    letterGradeRange: string;
    percentageRange: PercentageRange;
    feedback: GradeFeedback;
    categoryScores: CategoryScores;
    modelResults: ModelResult[];
    totalTokens?: number;
    apiCost?: string;
  }> {
  if (
    !essay.assignmentBrief?.instructions
    || !essay.content
    || !essay.assignmentBrief?.academicLevel
  ) {
    throw new Error(
      'Essay missing required fields: instructions, content, or academicLevel',
    );
  }

  // Build grading prompt
  const prompt = buildGradingPrompt({
    instructions: essay.assignmentBrief.instructions,
    rubric: essay.rubric?.customCriteria,
    focusAreas: essay.focusAreas ?? essay.rubric?.focusAreas,
    academicLevel: essay.assignmentBrief.academicLevel,
    content: essay.content,
  });

  // Run parallel AI calls with retry logic
  const gradingPromises = runModels.map(async (modelId, index) => {
    return retryWithBackoff(async () => {
      const model = getGradingModel(modelId);
      const result = await generateObject({
        model,
        schema: gradeOutputSchema,
        prompt,
        temperature: 0.7, // Consistent grading
      });

      return {
        model: modelId,
        index,
        result: result.object,
        usage: result.usage,
      };
    });
  });

  // Wait for all calls to complete (or fail)
  const results = await Promise.allSettled(gradingPromises);

  // Extract successful results
  const successfulResults = results
    .map((r, i) => {
      if (r.status === 'fulfilled') {
        return r.value;
      }
      // Failed - log error but continue with other results
      console.error(
        `Grading failed for model ${runModels[i]}:`,
        r.reason,
      );
      return null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (successfulResults.length === 0) {
    throw new Error(
      'All AI grading attempts failed. Please try again or contact support.',
    );
  }

  // Extract scores for outlier detection
  const scores = successfulResults.map(r => ({
    model: r.model,
    percentage: clampPercentage(r.result.percentage),
  }));

  // Apply outlier detection
  const outlierResults = detectOutliers(scores);

  // Filter to included scores only
  const includedResults = successfulResults.filter((_, i) =>
    outlierResults[i]?.included,
  );

  if (includedResults.length === 0) {
    throw new Error(
      'All grading results were excluded as outliers. Please try again.',
    );
  }

  // Calculate grade range from included scores
  const includedPercentages = includedResults.map(r =>
    clampPercentage(r.result.percentage),
  );
  const lowerBound = Math.min(...includedPercentages);
  const upperBound = Math.max(...includedPercentages);

  // Select feedback from lowest scorer (most critical perspective)
  const lowestScorer = includedResults.reduce((lowest, current) =>
    current.result.percentage < lowest.result.percentage ? current : lowest,
  );

  // Convert to schema format
  const feedback: GradeFeedback = {
    strengths: lowestScorer.result.feedback.strengths,
    improvements: lowestScorer.result.feedback.improvements,
    languageTips: lowestScorer.result.feedback.languageTips,
    resources: lowestScorer.result.feedback.resources,
  };

  // Aggregate category scores from all included models (average)
  const categoryScoresArray = includedResults.map(r => r.result.categoryScores);
  const categoryScores: CategoryScores = {
    contentUnderstanding: clampPercentage(
      categoryScoresArray.reduce(
        (sum, cs) => sum + cs.contentUnderstanding,
        0,
      ) / categoryScoresArray.length,
    ),
    structureOrganization: clampPercentage(
      categoryScoresArray.reduce(
        (sum, cs) => sum + cs.structureOrganization,
        0,
      ) / categoryScoresArray.length,
    ),
    criticalAnalysis: clampPercentage(
      categoryScoresArray.reduce(
        (sum, cs) => sum + cs.criticalAnalysis,
        0,
      ) / categoryScoresArray.length,
    ),
    languageStyle: clampPercentage(
      categoryScoresArray.reduce(
        (sum, cs) => sum + cs.languageStyle,
        0,
      ) / categoryScoresArray.length,
    ),
    citationsReferences:
      categoryScoresArray.every(cs => cs.citationsReferences !== undefined)
        ? clampPercentage(
          categoryScoresArray.reduce(
            (sum, cs) => sum + (cs.citationsReferences ?? 0),
            0,
          ) / categoryScoresArray.length,
        )
        : undefined,
  };

  // Build model results with outlier information
  const modelResults: ModelResult[] = successfulResults.map((r, i) => {
    const outlierInfo = outlierResults[i];
    return {
      model: r.model,
      percentage: clampPercentage(r.result.percentage),
      included: outlierInfo?.included ?? false,
      reason: outlierInfo?.reason,
    };
  });

  // Calculate total tokens and cost (if available)
  const totalTokens = successfulResults.reduce(
    (sum, r) => sum + (r.usage?.totalTokens ?? 0),
    0,
  );

  // Note: API cost calculation would require OpenRouter pricing data
  // For now, we'll leave it undefined and can add cost tracking later
  const apiCost = undefined;

  return {
    letterGradeRange: convertToLetterGrade(lowerBound, upperBound),
    percentageRange: {
      lower: lowerBound,
      upper: upperBound,
    },
    feedback,
    categoryScores,
    modelResults,
    totalTokens,
    apiCost,
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

      // 5. Generate results using AI or mock
      let results: {
        letterGradeRange: string;
        percentageRange: PercentageRange;
        feedback: GradeFeedback;
        categoryScores: CategoryScores;
        modelResults: ModelResult[];
        totalTokens?: number;
        apiCost?: string;
      };

      if (mode === 'mock') {
        results = generateMockGrade(runModels);
      } else {
        // Real AI grading
        results = await runAIGrading(essay, runModels);
      }

      // 6. Complete the grade
      await ctx.runMutation(internal.grades.complete, {
        gradeId,
        letterGradeRange: results.letterGradeRange,
        percentageRange: results.percentageRange,
        feedback: results.feedback,
        categoryScores: results.categoryScores,
        modelResults: results.modelResults,
        totalTokens: results.totalTokens,
        apiCost: results.apiCost,
      });

      // 8. Clear credit reservation and record transaction
      await ctx.runMutation(internal.credits.clearReservation, {
        userId: grade.userId,
        amount: GRADING_COST,
        gradeId,
        description: `Grading for essay: ${essay.assignmentBrief?.title ?? 'Untitled'}`,
      });
    } catch (error) {
      // Extract raw error details for logging and internal persistence
      const rawMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      // Log original error for debugging (includes full details)
      console.error('Grading failed:', {
        gradeId,
        error: error instanceof Error ? error : { message: rawMessage },
        stack,
      });

      // Try to get the grade to refund and record failure
      try {
        const grade = await ctx.runQuery(internal.grades.getInternal, {
          gradeId,
        });

        if (grade) {
          // Record failure details internally (never exposed to users)
          await ctx.runMutation(internal.gradeFailures.record, {
            gradeId,
            userId: grade.userId,
            rawMessage,
            stack,
          });

          // Fail the grade with generic user-facing message
          await ctx.runMutation(internal.grades.fail, {
            gradeId,
            errorMessage: USER_ERROR_MESSAGE,
          });

          // Refund the credit (generic reason, no internal details)
          await ctx.runMutation(internal.credits.refundReservation, {
            userId: grade.userId,
            amount: GRADING_COST,
            gradeId,
            reason: 'Grading failed - credit refunded',
          });
        } else {
          // Grade not found - still try to record failure if we have gradeId
          await ctx.runMutation(internal.gradeFailures.record, {
            gradeId,
            userId: undefined,
            rawMessage,
            stack,
          });
        }
      } catch (innerError) {
        // Log both the original error and the inner error from cleanup
        console.error('Failed to handle grading failure:', {
          gradeId,
          originalError: error,
          innerError,
        });
      }
    }
  },
});

// Note: Internal queries for getGradeInternal and getEssayInternal
// are defined in their respective files (grades.ts and essays.ts)
