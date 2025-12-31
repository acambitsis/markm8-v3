// AI Grading Action
// Background job that processes essay grading

import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalAction } from './_generated/server';

const GRADING_COST = '1.00';

// Types for grading results
type PercentageRange = {
  lower: number;
  upper: number;
};

type GradeFeedback = {
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

type ModelResult = {
  model: string;
  percentage: number;
  included: boolean;
  reason?: string;
};

/**
 * Generate mock grading results for testing
 * TODO: Replace with actual AI grading when OpenRouter is configured
 */
function generateMockGrade(): {
  letterGradeRange: string;
  percentageRange: PercentageRange;
  feedback: GradeFeedback;
  modelResults: ModelResult[];
} {
  // Generate random percentage between 70-95
  const basePercentage = Math.floor(Math.random() * 26) + 70;
  const lowerBound = Math.max(0, basePercentage - 3);
  const upperBound = Math.min(100, basePercentage + 3);

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
    modelResults: [
      { model: 'grok-4', percentage: basePercentage - 2, included: true },
      { model: 'grok-4', percentage: basePercentage, included: true },
      { model: 'grok-4', percentage: basePercentage + 2, included: true },
    ],
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
      // 1. Get the grade record
      const grade = await ctx.runQuery(internal.grades.getInternal, {
        gradeId,
      });

      if (!grade) {
        throw new Error('Grade not found');
      }

      // 2. Get the essay
      const essay = await ctx.runQuery(internal.essays.getInternal, {
        essayId: grade.essayId,
      });

      if (!essay) {
        throw new Error('Essay not found');
      }

      // 3. Update status to processing
      await ctx.runMutation(internal.grades.startProcessing, { gradeId });

      // 4. Simulate processing delay (1-3 seconds)
      await new Promise(resolve =>
        setTimeout(resolve, 1000 + Math.random() * 2000),
      );

      // 5. Generate mock results
      // TODO: Replace with actual AI grading:
      // - Call OpenRouter API with 3x Grok-4 in parallel
      // - Implement retry logic (3 retries, exponential backoff)
      // - Outlier detection (exclude furthest from mean if >10% deviation)
      const results = generateMockGrade();

      // 6. Complete the grade
      await ctx.runMutation(internal.grades.complete, {
        gradeId,
        ...results,
      });

      // 7. Clear credit reservation and record transaction
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
