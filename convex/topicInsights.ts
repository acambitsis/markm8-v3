// Essay Observations Action
// Generates observations about the essay to show understanding during grading wait
// Called directly from client, returns results (not persisted)

import { generateObject } from 'ai';
import { v } from 'convex/values';
import { z } from 'zod';

import { internal } from './_generated/api';
import { action } from './_generated/server';
import { getGradingModel } from './lib/ai';

// Zod schema for structured LLM output
const essayObservationSchema = z.object({
  stage: z
    .string()
    .describe(
      'Process label showing what we\'re analyzing. Use present continuous. Examples: "Identifying your thesis", "Analyzing your argument structure", "Recognizing your evidence"',
    ),
  quote: z
    .string()
    .describe(
      'EXACT excerpt from the essay (10-15 words). Must be a direct quote, not paraphrased.',
    ),
  note: z
    .string()
    .describe(
      'What we observe about this excerpt (8-12 words). Non-evaluative, just descriptive. Example: "A bold claim about technological transformation"',
    ),
});

const essayObservationsSchema = z.object({
  observations: z
    .array(essayObservationSchema)
    .length(6)
    .describe('Exactly 6 observations showing progressive understanding of the essay'),
});

// Model to use for observations (fast and cheap)
const OBSERVATIONS_MODEL = 'x-ai/grok-4.1-fast';

// System prompt - critical to generate essay-focused, non-evaluative content
const SYSTEM_PROMPT = `You analyze essays and generate observations that show you understand what the student wrote. Your output creates a sense of "the AI is reading my essay" during a grading wait.

CRITICAL RULES:
1. QUOTE EXACTLY from the essay - no paraphrasing. Use their actual words.
2. Be NON-EVALUATIVE - don't say "good" or "weak". Just describe what you see.
3. Stage labels should feel like active processing: "Identifying...", "Analyzing...", "Recognizing..."
4. Notes should be observational: "A claim about X", "Building from Y", "Connecting to Z"

STAGE LABEL EXAMPLES (use variety):
- "Identifying your thesis"
- "Analyzing your argument structure"
- "Recognizing your evidence"
- "Understanding your perspective"
- "Examining your reasoning"
- "Noting your key claims"
- "Tracing your logic"
- "Observing your approach"

NOTE EXAMPLES (descriptive, not evaluative):
- "A bold claim about technological change"
- "Building from specific examples"
- "Connecting historical context to present"
- "Quantitative support for the argument"
- "A personal perspective on the issue"
- "Contrasting two viewpoints"

WRONG (evaluative):
- "A well-constructed argument" ❌
- "Strong evidence" ❌
- "Could be clearer" ❌

RIGHT (descriptive):
- "An argument linking cause and effect" ✓
- "Statistical evidence from recent studies" ✓
- "A direct statement of position" ✓`;

/**
 * Generate essay observations
 * Called directly from client, returns results (not persisted)
 */
export const generate = action({
  args: { gradeId: v.id('grades') },
  handler: async (ctx, { gradeId }): Promise<z.infer<typeof essayObservationsSchema>> => {
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

    // 5. Get essay content (use more content for better quote extraction)
    const content = essay.content ?? '';
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const excerpt = words.slice(0, 800).join(' '); // More context for quote extraction
    const title = essay.assignmentBrief?.title ?? 'Untitled Essay';
    const subject = essay.assignmentBrief?.subject ?? 'General';

    // 6. Build the user prompt
    const userPrompt = `ESSAY TITLE: ${title}
SUBJECT AREA: ${subject}

ESSAY CONTENT:
${excerpt}

Generate 6 observations that show you're actively understanding this essay. Each observation must:
1. Quote EXACTLY from the essay above (10-15 words, their actual words)
2. Have a process-oriented stage label ("Identifying...", "Analyzing...", etc.)
3. Include a brief, non-evaluative note about what you observe

Spread observations across different parts of the essay - don't cluster them all at the beginning.`;

    // 7. Call LLM for structured output
    const model = getGradingModel(OBSERVATIONS_MODEL);

    try {
      const result = await generateObject({
        model,
        schema: essayObservationsSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: 0.5, // Lower temperature for more faithful quotes
        maxOutputTokens: 800,
      });

      return result.object;
    } catch {
      // LLM call failed - throw generic error (non-critical feature)
      throw new Error('Failed to generate essay observations');
    }
  },
});
