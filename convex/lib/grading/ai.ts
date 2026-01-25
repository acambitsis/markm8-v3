// AI Grading
// Real AI grading with multi-model consensus

import { generateObject } from 'ai';

import type {
  AcademicLevel,
  CategoryScores,
  GradeFeedback,
  GradingConfig,
  ModelResult,
  PercentageRange,
} from '../../schema';
import { getGradingModel } from '../ai';
import { type GradeOutput, gradeOutputSchema } from '../gradeSchema';
import { buildGradingPrompt, GRADING_PROMPT_VERSION } from '../gradingPrompt';
import { reportToSentry } from '../sentry';
import type { RawGradingFeedback } from './synthesis';
import {
  clampPercentage,
  detectOutliers,
  retryWithBackoff,
} from './utils';

/**
 * Categorizes why a grading run failed for clear logging
 */
type FailureReason =
  | { type: 'recovered'; issue: string }
  | { type: 'parse_error'; issue: string }
  | { type: 'truncated' }
  | { type: 'api_error'; issue: string }
  | { type: 'unknown'; issue: string };

/**
 * Attempts to extract and parse JSON from an AI SDK error response.
 * Handles: leading/trailing whitespace, markdown code fences, minor formatting issues.
 */
function tryParseFromError(error: unknown): { result: GradeOutput; issue: string } | null {
  const errorObj = error as { name?: string; text?: string; cause?: { text?: string } };
  const rawText = errorObj.text ?? errorObj.cause?.text;
  if (!rawText) {
    return null;
  }

  // Only attempt recovery for JSON parse errors
  const errorName = errorObj.name;
  if (errorName !== 'AI_NoObjectGeneratedError' && errorName !== 'AI_JSONParseError') {
    return null;
  }

  try {
    let cleanText = rawText.trim();

    // Track what we're fixing for logging
    const issues: string[] = [];
    if (rawText !== cleanText) {
      issues.push('whitespace');
    }

    // Remove markdown code fences if present
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\n?```\s*$/, '');
      issues.push('markdown');
    }

    // Parse the cleaned JSON
    const parsed = JSON.parse(cleanText);

    // Validate required structure
    if (
      typeof parsed.percentage !== 'number'
      || !parsed.feedback
      || !parsed.categoryScores
    ) {
      return null;
    }

    return {
      result: parsed as GradeOutput,
      issue: issues.length > 0 ? issues.join('+') : 'format',
    };
  } catch {
    return null;
  }
}

/**
 * Extracts detailed error information from AI SDK errors
 * AI SDK errors often have nested cause chains with the actual API response
 */
function extractErrorDetails(error: unknown): {
  message: string;
  name: string;
  responseBody?: unknown;
  statusCode?: number;
  cause?: unknown;
} {
  const errorObj = error as {
    name?: string;
    message?: string;
    text?: string;
    cause?: {
      text?: string;
      message?: string;
      responseBody?: unknown;
      statusCode?: number;
      cause?: unknown;
    };
    data?: unknown;
    responseBody?: unknown;
    statusCode?: number;
  };

  // Try to extract the most detailed error information
  // AI SDK wraps errors in cause chains
  let responseBody = errorObj.responseBody ?? errorObj.data;
  let statusCode = errorObj.statusCode;
  let detailedMessage = errorObj.message ?? 'Unknown error';

  // Check nested cause for more details
  if (errorObj.cause) {
    responseBody = responseBody ?? errorObj.cause.responseBody;
    statusCode = statusCode ?? errorObj.cause.statusCode;
    if (errorObj.cause.message && errorObj.cause.message !== errorObj.message) {
      detailedMessage = `${detailedMessage} -> ${errorObj.cause.message}`;
    }
  }

  return {
    message: detailedMessage,
    name: errorObj.name ?? 'Unknown',
    responseBody,
    statusCode,
    cause: errorObj.cause,
  };
}

/**
 * Determines the failure reason for logging
 */
function categorizeFailure(error: unknown): FailureReason {
  const errorObj = error as {
    name?: string;
    message?: string;
    text?: string;
    cause?: { text?: string };
  };

  const errorName = errorObj.name ?? 'Unknown';
  const rawText = errorObj.text ?? errorObj.cause?.text ?? '';

  // Check for truncated response (incomplete JSON)
  if (rawText && !rawText.trim().endsWith('}')) {
    return { type: 'truncated' };
  }

  // Categorize by error type
  if (errorName === 'AI_NoObjectGeneratedError' || errorName === 'AI_JSONParseError') {
    return { type: 'parse_error', issue: errorName };
  }

  if (errorName.includes('API') || errorName.includes('Network')) {
    return { type: 'api_error', issue: errorObj.message ?? errorName };
  }

  return { type: 'unknown', issue: errorObj.message ?? errorName };
}

/**
 * Callback fired when a model completes grading (success or failure)
 * Used for real-time progress updates in the UI
 */
export type OnModelComplete = (
  index: number,
  status: 'complete' | 'failed',
) => Promise<void>;

/**
 * Runs AI grading using the configured ensemble approach
 *
 * @param essay - Essay data with assignment brief, rubric, and content
 * @param essay.assignmentBrief - Assignment instructions and academic level
 * @param essay.rubric - Grading rubric with custom criteria and focus areas
 * @param essay.focusAreas - Specific areas to focus on during grading
 * @param essay.content - Essay content to be graded
 * @param config - Grading configuration from platformSettings.aiConfig.grading
 * @param onModelComplete - Optional callback fired as each model completes
 */
export async function runAIGrading(
  essay: {
    assignmentBrief?: {
      instructions: string;
      academicLevel: AcademicLevel;
    } | null;
    rubric?: { customCriteria?: string; focusAreas?: string[] } | null;
    focusAreas?: string[];
    content?: string | null;
  },
  config: GradingConfig,
  onModelComplete?: OnModelComplete,
): Promise<{
    percentageRange: PercentageRange;
    feedback: GradeFeedback;
    categoryScores: CategoryScores;
    modelResults: ModelResult[];
    rawFeedback: RawGradingFeedback[];
    totalTokens?: number;
    apiCost?: string;
    promptVersion: string;
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

  // Extract config values (maxTokens is required - must be set via seed/migration)
  const { runs, temperature, outlierThresholdPercent, retry, maxTokens } = config;

  if (maxTokens === undefined) {
    throw new Error(
      'maxTokens not configured in platformSettings.aiConfig.grading. Run migration: npx convex run seed/migrations/addMaxTokensToGrading:migrate',
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

  // Track start times for each model (needed for both success and failure duration)
  const startTimes: number[] = [];

  // Run parallel AI calls with retry logic
  // Each call tracks its own duration for accurate per-model timing
  const gradingPromises = runs.map(async (run, index) => {
    const startTime = Date.now();
    startTimes[index] = startTime; // Also store for failure recovery path
    try {
      const result = await retryWithBackoff(
        async () => {
          const model = getGradingModel(run.model);

          // Build provider options for reasoning if configured
          const providerOptions = run.reasoningEffort
            ? {
                openrouter: {
                  reasoning: { effort: run.reasoningEffort },
                },
              }
            : undefined;

          const aiResult = await generateObject({
            model,
            schema: gradeOutputSchema,
            prompt,
            temperature,
            maxOutputTokens: maxTokens,
            providerOptions,
            system: 'You are an expert academic essay grader. Provide thorough, constructive feedback. Output only the requested structured data with no leading or trailing whitespace.',
          });

          // Extract cost from OpenRouter provider metadata
          const cost = (aiResult.providerMetadata as any)?.openrouter?.usage?.cost;

          return {
            model: run.model,
            index,
            result: aiResult.object,
            usage: aiResult.usage,
            cost: typeof cost === 'number' ? cost : undefined,
          };
        },
        retry.maxRetries,
        retry.backoffMs,
      );
      // Capture duration when THIS model completes (success case)
      const durationMs = Date.now() - startTime;

      // Fire callback on success (non-blocking, but await to ensure mutation completes)
      await onModelComplete?.(index, 'complete');

      return { ...result, durationMs };
    } catch (error) {
      // Fire callback on failure before re-throwing
      await onModelComplete?.(index, 'failed');
      throw error;
    }
  });

  // Wait for all calls to complete (or fail)
  const results = await Promise.allSettled(gradingPromises);

  // Extract successful results (includes recovery from JSON parse errors)
  const successfulResults = results
    .map((r, i) => {
      const model = runs[i]?.model ?? 'unknown';

      if (r.status === 'fulfilled') {
        // Use the duration captured at completion time (more accurate)
        return r.value;
      }

      // Failed - calculate duration for failure cases
      // (approximation: time from start until we process the failure)
      const durationMs = Date.now() - (startTimes[i] ?? Date.now());

      // Attempt recovery from JSON parse errors
      const error = r.reason;
      const recovered = tryParseFromError(error);

      if (recovered) {
        // Successfully recovered - log concisely
        console.error(`[GRADING] ${model}: recovered (${recovered.issue})`);
        return {
          model,
          index: i,
          result: recovered.result,
          usage: undefined,
          cost: undefined, // Cost not available for recovered responses
          durationMs,
        };
      }

      // Recovery failed - log failure with category and full details
      const failure = categorizeFailure(error);
      const errorDetails = extractErrorDetails(error);
      const failureMsg = failure.type === 'truncated'
        ? 'response truncated (increase maxTokens?)'
        : failure.type === 'api_error'
          ? `API error: ${failure.issue}`
          : failure.type === 'parse_error'
            ? `parse failed: ${failure.issue}`
            : `failed: ${failure.issue}`;

      // Log concise message for quick identification
      console.error(`[GRADING] ${model}: ${failureMsg}`);
      // Log full error details for debugging
      console.error(`[GRADING] ${model} full error:`, JSON.stringify({
        name: errorDetails.name,
        message: errorDetails.message,
        statusCode: errorDetails.statusCode,
        responseBody: errorDetails.responseBody,
      }, null, 2));

      // Report partial failure to Sentry (fire-and-forget, don't block grading)
      void reportToSentry({
        error: error instanceof Error ? error : new Error(failureMsg),
        functionName: 'grading.runAIGrading',
        functionType: 'action',
        tags: {
          'grading.status': 'partial_failure',
          'grading.model': model,
          'grading.failure_type': failure.type,
          'grading.status_code': errorDetails.statusCode?.toString() ?? 'unknown',
        },
        extra: {
          modelIndex: i,
          totalRuns: runs.length,
          errorName: errorDetails.name,
          errorMessage: errorDetails.message,
          statusCode: errorDetails.statusCode,
          responseBody: errorDetails.responseBody,
        },
      });

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

  // Apply outlier detection with configured threshold
  const outlierResults = detectOutliers(scores, outlierThresholdPercent);

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
  const avgScore = (getter: (cs: (typeof categoryScoresArray)[0]) => number) =>
    clampPercentage(
      categoryScoresArray.reduce((sum, cs) => sum + getter(cs), 0) / categoryScoresArray.length,
    );

  const categoryScores: CategoryScores = {
    contentUnderstanding: avgScore(cs => cs.contentUnderstanding),
    structureOrganization: avgScore(cs => cs.structureOrganization),
    criticalAnalysis: avgScore(cs => cs.criticalAnalysis),
    languageStyle: avgScore(cs => cs.languageStyle),
    citationsReferences: categoryScoresArray.every(cs => cs.citationsReferences !== undefined)
      ? avgScore(cs => cs.citationsReferences ?? 0)
      : undefined,
  };

  // Build model results with outlier information, duration, and cost
  const modelResults: ModelResult[] = successfulResults.map((r, i) => {
    const outlierInfo = outlierResults[i];
    return {
      model: r.model,
      percentage: clampPercentage(r.result.percentage),
      included: outlierInfo?.included ?? false,
      reason: outlierInfo?.reason,
      durationMs: r.durationMs,
      cost: typeof r.cost === 'number' ? r.cost.toFixed(4) : undefined,
    };
  });

  // Build raw feedback array for synthesis (only included results)
  const rawFeedback: RawGradingFeedback[] = includedResults.map(r => ({
    model: r.model,
    percentage: clampPercentage(r.result.percentage),
    feedback: {
      strengths: r.result.feedback.strengths,
      improvements: r.result.feedback.improvements,
      languageTips: r.result.feedback.languageTips,
      resources: r.result.feedback.resources,
    },
  }));

  // Calculate total tokens and cost (if available)
  const totalTokens = successfulResults.reduce(
    (sum, r) => sum + (r.usage?.totalTokens ?? 0),
    0,
  );

  // Calculate total API cost from OpenRouter usage data
  const totalCost = successfulResults.reduce(
    (sum, r) => sum + (typeof r.cost === 'number' ? r.cost : 0),
    0,
  );
  const apiCost = totalCost > 0 ? totalCost.toFixed(4) : undefined;

  // Log cost summary for observability (console.error used for server-side visibility)
  console.error(
    `[GRADING] Completed: ${successfulResults.length}/${runs.length} models, `
    + `${totalTokens} tokens, cost: $${apiCost ?? 'N/A'}`,
  );

  return {
    percentageRange: {
      lower: lowerBound,
      upper: upperBound,
    },
    feedback,
    categoryScores,
    modelResults,
    rawFeedback,
    totalTokens,
    apiCost,
    promptVersion: GRADING_PROMPT_VERSION,
  };
}
