// AI Grading
// Real AI grading with multi-model consensus

import { generateObject } from 'ai';

import type {
  CategoryScores,
  GradeFeedback,
  ModelResult,
  PercentageRange,
} from '../../schema';
import { getGradingModel } from '../ai';
import { buildGradingPrompt } from '../gradingPrompt';
import { gradeOutputSchema } from '../gradingSchema';
import {
  clampPercentage,
  convertToLetterGrade,
  detectOutliers,
  retryWithBackoff,
} from './utils';

/**
 * Run real AI grading with multi-model consensus
 * Executes N parallel AI calls, applies outlier detection, and aggregates results
 */
export async function runAIGrading(
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
