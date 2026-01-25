// AI Grading Action
// Background job that processes essay grading
// Grading cost fetched from platformSettings (no hardcoded defaults)

import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import {
  generateMockGrade,
  runAIGrading,
  runSynthesis,
  USER_ERROR_MESSAGE,
} from './lib/grading';
import { reportToSentry } from './lib/sentry';
import type { GradeFeedback } from './schema';

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

      // Synthesis requires explicit configuration - no hidden defaults
      const synthesisConfig = aiConfig.synthesis;
      const synthesisEnabled = synthesisConfig?.enabled && gradingConfig.mode !== 'mock';

      // 5. Initialize progress tracking
      const models = gradingConfig.runs.map(run => run.model);
      await ctx.runMutation(internal.grades.initializeProgress, {
        gradeId,
        models,
        synthesisEnabled: !!synthesisEnabled,
      });

      // 6. Generate results using AI or mock
      let results: Awaited<ReturnType<typeof runAIGrading>>;

      if (gradingConfig.mode === 'mock') {
        results = generateMockGrade(gradingConfig);
      } else {
        // Real AI grading
        results = await runAIGrading(essay, gradingConfig);
      }

      // 7. Run feedback synthesis if enabled
      let finalFeedback: GradeFeedback = results.feedback;
      let synthesized = false;
      let synthesisCost: string | undefined;
      let synthesisPromptVersion: string | undefined;
      let totalApiCost = results.apiCost;

      if (synthesisEnabled && results.rawFeedback.length > 0) {
        await ctx.runMutation(internal.grades.updateSynthesisStatus, {
          gradeId,
          status: 'processing',
        });

        try {
          const synthesisResult = await runSynthesis(
            {
              assignmentTitle: essay.assignmentBrief?.title,
              assignmentInstructions: essay.assignmentBrief?.instructions,
              academicLevel: essay.assignmentBrief?.academicLevel,
              rubric: essay.rubric?.customCriteria,
              focusAreas: essay.focusAreas ?? essay.rubric?.focusAreas,
              essayContent: essay.content ?? '',
              feedbackFromRuns: results.rawFeedback,
            },
            synthesisConfig!, // Safe: synthesisEnabled check guarantees config exists
          );

          finalFeedback = synthesisResult.feedback;
          synthesized = true;
          synthesisCost = synthesisResult.cost?.toFixed(4);
          synthesisPromptVersion = synthesisResult.promptVersion;

          // Add synthesis cost to total API cost
          if (synthesisResult.cost && synthesisResult.cost > 0) {
            const gradingCostNum = results.apiCost ? Number.parseFloat(results.apiCost) : 0;
            totalApiCost = (gradingCostNum + synthesisResult.cost).toFixed(4);
          }

          await ctx.runMutation(internal.grades.updateSynthesisStatus, {
            gradeId,
            status: 'complete',
          });

          console.error(
            `[GRADING] Synthesis completed: ${synthesisResult.durationMs}ms, cost: $${synthesisCost ?? 'N/A'}`,
          );
        } catch (synthesisError) {
          // Synthesis failed - log and continue with fallback (lowest-scorer feedback)
          console.error('[GRADING] Synthesis failed, using fallback:', synthesisError);

          await ctx.runMutation(internal.grades.updateSynthesisStatus, {
            gradeId,
            status: 'failed',
          });

          // Report to Sentry (non-blocking)
          void reportToSentry({
            error: synthesisError instanceof Error ? synthesisError : new Error(String(synthesisError)),
            functionName: 'grading.processGrade.synthesis',
            functionType: 'action',
            userId: grade.userId,
            tags: { 'grading.status': 'synthesis_failure', 'grade.id': gradeId },
            extra: { gradeId, synthesisModel: synthesisConfig?.model },
          });

          // Keep synthesized = false, use original fallback feedback
        }
      } else {
        // Synthesis skipped - either disabled or no feedback to synthesize
        await ctx.runMutation(internal.grades.updateSynthesisStatus, {
          gradeId,
          status: 'skipped',
        });
      }

      // 8. Complete the grade
      await ctx.runMutation(internal.grades.complete, {
        gradeId,
        percentageRange: results.percentageRange,
        feedback: finalFeedback,
        categoryScores: results.categoryScores,
        modelResults: results.modelResults,
        totalTokens: results.totalTokens,
        apiCost: totalApiCost,
        promptVersion: results.promptVersion,
        synthesisPromptVersion,
        synthesized,
        synthesisCost,
      });

      // 9. Clear credit reservation and record transaction
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

      // Try to get the grade for Sentry context and refund
      // Single query reused for both Sentry reporting and failure handling
      let grade: Awaited<ReturnType<typeof ctx.runQuery<typeof internal.grades.getInternal>>> | undefined;
      try {
        grade = await ctx.runQuery(internal.grades.getInternal, { gradeId });
      } catch {
        // Ignore - we'll handle missing grade below
      }

      // Report to Sentry for alerting and tracking
      await reportToSentry({
        error: error instanceof Error ? error : new Error(rawMessage),
        functionName: 'grading.processGrade',
        functionType: 'action',
        userId: grade?.userId,
        tags: { 'grading.status': 'full_failure', 'grade.id': gradeId },
        extra: { gradeId },
      });

      // Handle failure: record, update status, and refund
      try {
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
