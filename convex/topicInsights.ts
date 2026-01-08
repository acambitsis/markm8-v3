// Topic Insights Action
// Generates non-evaluative content about the essay topic
// Called directly from client during grading wait, returns results (not persisted)

import { generateObject } from 'ai';
import { v } from 'convex/values';
import { z } from 'zod';

import { internal } from './_generated/api';
import { action } from './_generated/server';
import { getGradingModel } from './lib/ai';

// Zod schema for structured LLM output
// CRITICAL: All responses must be SHORT phrases for casual scanning
const topicInsightsSchema = z.object({
  hooks: z
    .array(z.string())
    .length(3)
    .describe(
      'Exactly 3 punchy one-liners about the topic. MAX 12 words each. Example: "Hamlet explores the paralysis of overthinking"',
    ),
  thinkers: z
    .array(z.string())
    .length(3)
    .describe(
      'Exactly 3 thinkers: "Name — 3-word descriptor". Example: "Freud — psychoanalytic interpretation pioneer"',
    ),
  concepts: z
    .array(z.string())
    .length(3)
    .describe(
      'Exactly 3 key concepts/terms. MAX 8 words each. Example: "The revenge tragedy genre"',
    ),
  funFact: z
    .string()
    .describe(
      'One surprising fact. MAX 15 words. Example: "Hamlet has 4,042 lines — Shakespeare\'s longest play"',
    ),
  reads: z
    .array(z.string())
    .length(2)
    .describe(
      'Exactly 2 book titles ONLY (no authors, no descriptions). Example: "Hamlet in Purgatory"',
    ),
});

// Model to use for topic insights (fast and cheap)
const TOPIC_INSIGHTS_MODEL = 'x-ai/grok-4.1-fast';

// System prompt - critical to ensure SHORT, non-evaluative content
const SYSTEM_PROMPT = `You generate ULTRA-SHORT phrases about academic topics. The student is casually waiting — they want quick, scannable bites, NOT paragraphs.

CRITICAL FORMAT RULES:
- hooks: MAX 12 words each. Punchy. Like a tweet.
- thinkers: "Name — 3 words". Example: "Freud — psychoanalysis founder"
- concepts: MAX 8 words. Just the term/idea.
- funFact: MAX 15 words. One surprising stat or fact.
- reads: Book titles ONLY. No authors. No descriptions.

WRONG (too long):
"The intellectual territory of Hamlet's internal conflicts explores the profound psychological depths..."

RIGHT (punchy):
"Hamlet wrestles with action vs. overthinking"

CONTENT RULES:
- Do NOT evaluate the essay quality or give feedback
- ONLY discuss the TOPIC, not the essay itself
- Be interesting but extremely concise
- Every phrase should be instantly scannable`;

/**
 * Generate topic insights for an essay
 * Called directly from client, returns results (not persisted)
 */
export const generate = action({
  args: { gradeId: v.id('grades') },
  handler: async (ctx, { gradeId }): Promise<z.infer<typeof topicInsightsSchema>> => {
    // 1. Auth check - get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized: Not authenticated');
    }

    // 2. Get the grade record
    const grade = await ctx.runQuery(internal.grades.getInternal, {
      gradeId,
    });

    if (!grade) {
      throw new Error('Grade not found');
    }

    // 3. Verify user owns this grade
    const user = await ctx.runQuery(internal.users.getByClerkId, {
      clerkId: identity.subject,
    });
    if (!user || grade.userId !== user._id) {
      throw new Error('Unauthorized: Cannot access this grade');
    }

    // 4. Get the essay
    const essay = await ctx.runQuery(internal.essays.getInternal, {
      essayId: grade.essayId,
    });

    if (!essay) {
      throw new Error('Essay not found');
    }

    // 5. Prepare essay excerpt (first ~500 words to keep costs low)
    const content = essay.content ?? '';
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const excerpt = words.slice(0, 500).join(' ');
    const title = essay.assignmentBrief?.title ?? 'Untitled Essay';
    const subject = essay.assignmentBrief?.subject ?? 'General';

    // 6. Build the user prompt
    const userPrompt = `ESSAY TITLE: ${title}
SUBJECT AREA: ${subject}

ESSAY EXCERPT (first ~500 words):
${excerpt}

Based on the topic of this essay, provide engaging context about the subject area. Remember: discuss the TOPIC, not the essay itself.`;

    // 7. Call Grok 4.1 Fast for structured output
    const model = getGradingModel(TOPIC_INSIGHTS_MODEL);

    try {
      const result = await generateObject({
        model,
        schema: topicInsightsSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: 0.7, // Slightly creative for engaging content
        maxOutputTokens: 600, // Keep response concise
      });

      // 8. Return the insights directly (not persisted)
      return result.object;
    } catch {
      // LLM call failed - throw generic error (non-critical feature)
      throw new Error('Failed to generate topic insights');
    }
  },
});
