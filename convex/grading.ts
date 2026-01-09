// AI Grading Action
// Background job that processes essay grading
// Grading cost fetched from platformSettings (no hardcoded defaults)

import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import {
  generateMockGrade,
  runAIGrading,
  USER_ERROR_MESSAGE,
} from './lib/grading';

/**
 * Process a grade (background action)
 * This is scheduled when an essay is submitted
 */
export const processGrade = internalAction({
  args: { gradeId: v.id('grades') },
  handler: async (ctx, { gradeId }) => {
    // Fetch grading cost from platformSettings (used for both success and failure paths)
    const gradingCost = await ctx.runQuery(
      internal.platformSettings.getGradingCost,
      {},
    );

    try {
      // Fetch AI config from database
      const aiConfig = await ctx.runQuery(
        internal.platformSettings.getAiConfig,
        {},
      );
      const gradingConfig = aiConfig.grading;

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
      let results: Awaited<ReturnType<typeof runAIGrading>>;

      if (gradingConfig.mode === 'mock') {
        results = generateMockGrade(gradingConfig);
      } else {
        // Real AI grading
        results = await runAIGrading(essay, gradingConfig);
      }

      // 6. Complete the grade
      await ctx.runMutation(internal.grades.complete, {
        gradeId,
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
        amount: gradingCost,
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
            amount: gradingCost,
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
