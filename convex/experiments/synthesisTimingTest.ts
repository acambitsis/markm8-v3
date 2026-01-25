// Synthesis Timing Experiment
// Tests how long feedback synthesis takes across different models
// Uses real essay data from the database for realistic context
//
// NOTE: This experiment uses sample grader feedback even when loading real essays.
// Only essay content, rubric, and assignment brief are pulled from the database.
// Individual grading run feedback is not currently persisted, so we use synthetic samples.
//
// Usage:
//   npx convex run experiments/synthesisTimingTest:run  # Uses built-in sample essay
//   npx convex run experiments/synthesisTimingTest:run '{"essayId": "<your-essay-id>"}'
//   npx convex run experiments/synthesisTimingTest:run '{"gradeId": "<your-grade-id>"}'
//
// Models tested:
// - google/gemini-3-pro-preview (Gemini 3 Pro)
// - anthropic/claude-sonnet-4 (Sonnet 4)
// - openai/gpt-5.2 (GPT 5.2 - no reasoning)
// - x-ai/grok-4 (Grok 4)

/* eslint-disable no-console */

import { generateObject } from 'ai';
import { v } from 'convex/values';
import { z } from 'zod';

import { internal } from '../_generated/api';
import { internalAction } from '../_generated/server';
import { getOpenRouterProvider } from '../lib/ai';

// Models to test (no reasoning effort - fast synthesis)
const MODELS_TO_TEST = [
  'google/gemini-3-pro-preview',
  'anthropic/claude-sonnet-4',
  'openai/gpt-5.2',
  'x-ai/grok-4',
] as const;

const RUNS_PER_MODEL = 3;

// Sample feedback from 3 "grading runs" - used as fallback or for testing without real data
const SAMPLE_FEEDBACK_FROM_RUNS = [
  {
    model: 'Model A',
    percentage: 72,
    feedback: {
      strengths: [
        {
          title: 'Clear thesis statement',
          description: 'The essay opens with a well-defined thesis that guides the reader.',
          evidence: '"The industrial revolution fundamentally transformed society..."',
        },
        {
          title: 'Good use of historical evidence',
          description: 'Multiple primary sources are cited to support arguments.',
        },
      ],
      improvements: [
        {
          title: 'Paragraph transitions need work',
          description: 'Several paragraphs lack smooth transitions between ideas.',
          suggestion: 'Add transitional phrases like "Furthermore" or "In contrast" at paragraph beginnings.',
        },
        {
          title: 'Conclusion is weak',
          description: 'The conclusion merely restates the thesis without synthesis.',
          suggestion: 'Expand the conclusion to discuss broader implications of your argument.',
        },
      ],
      languageTips: [
        { category: 'Grammar', feedback: 'Watch for subject-verb agreement in complex sentences.' },
        { category: 'Style', feedback: 'Vary sentence length to improve flow.' },
      ],
    },
  },
  {
    model: 'Model B',
    percentage: 68,
    feedback: {
      strengths: [
        {
          title: 'Strong opening paragraph',
          description: 'The introduction effectively hooks the reader and establishes context.',
          evidence: 'The vivid description of factory conditions draws readers in immediately.',
        },
        {
          title: 'Effective use of quotations',
          description: 'Direct quotes from historians strengthen the analysis.',
        },
        {
          title: 'Logical argument structure',
          description: 'Points build on each other in a coherent manner.',
        },
      ],
      improvements: [
        {
          title: 'Missing counterarguments',
          description: 'The essay does not address opposing viewpoints.',
          suggestion: 'Include a paragraph acknowledging and refuting alternative perspectives.',
        },
        {
          title: 'Some claims lack evidence',
          description: 'A few assertions are made without supporting sources.',
          suggestion: 'Add citations for claims about economic impact in paragraph 4.',
        },
      ],
      languageTips: [
        { category: 'Vocabulary', feedback: 'Use more precise academic vocabulary.' },
      ],
    },
  },
  {
    model: 'Model C',
    percentage: 75,
    feedback: {
      strengths: [
        {
          title: 'Excellent thesis',
          description: 'The thesis is specific, arguable, and well-positioned.',
          evidence: '"This essay argues that technological innovation, rather than political reform, drove social change."',
        },
        {
          title: 'Good paragraph structure',
          description: 'Each paragraph has a clear topic sentence and supporting details.',
        },
      ],
      improvements: [
        {
          title: 'Transitions between sections',
          description: 'The transition from economic to social analysis is abrupt.',
          suggestion: 'Add a bridging paragraph explaining how economic changes led to social shifts.',
        },
        {
          title: 'Conclusion could be stronger',
          description: 'The ending feels rushed and doesn\'t fully synthesize the argument.',
          suggestion: 'Spend more time on the "so what?" - why does this matter today?',
        },
        {
          title: 'Citation formatting inconsistent',
          description: 'Some citations use MLA, others appear to be APA.',
          suggestion: 'Standardize all citations to one format (check assignment requirements).',
        },
      ],
      languageTips: [
        { category: 'Grammar', feedback: 'Review comma usage with introductory clauses.' },
        { category: 'Clarity', feedback: 'Some sentences are overly complex - break them up.' },
      ],
    },
  },
];

// Schema for synthesized feedback output
const synthesizedFeedbackSchema = z.object({
  strengths: z.array(z.object({
    title: z.string(),
    description: z.string(),
    evidence: z.string().optional(),
  })).describe('3-4 best strengths, curated from all runs, with strongest evidence'),
  improvements: z.array(z.object({
    title: z.string(),
    description: z.string(),
    suggestion: z.string(),
  })).describe('3-4 most actionable improvements, merged if overlapping'),
  languageTips: z.array(z.object({
    category: z.string(),
    feedback: z.string(),
  })).describe('Consolidated language tips, no duplicates'),
});

/**
 * Builds the synthesis prompt with full essay context using XML delimiters
 */
function buildSynthesisPrompt(params: {
  assignmentTitle?: string;
  assignmentInstructions?: string;
  academicLevel?: string;
  rubric?: string;
  focusAreas?: string[];
  essayContent: string;
  feedbackFromRuns: typeof SAMPLE_FEEDBACK_FROM_RUNS;
}): string {
  const {
    assignmentTitle,
    assignmentInstructions,
    academicLevel,
    rubric,
    focusAreas,
    essayContent,
    feedbackFromRuns,
  } = params;

  return `You are synthesizing feedback from ${feedbackFromRuns.length} independent essay graders.

<assignment>
${assignmentTitle ? `<title>${assignmentTitle}</title>` : ''}
${assignmentInstructions ? `<instructions>${assignmentInstructions}</instructions>` : ''}
${academicLevel ? `<academic_level>${academicLevel}</academic_level>` : ''}
</assignment>

${rubric ? `<rubric>\n${rubric}\n</rubric>` : ''}

${focusAreas && focusAreas.length > 0 ? `<focus_areas>\n${focusAreas.map(a => `- ${a}`).join('\n')}\n</focus_areas>` : ''}

<essay>
${essayContent}
</essay>

<grader_feedback>
${feedbackFromRuns.map((run, i) => `
<grader_${i + 1} model="${run.model}" percentage="${run.percentage}">
${JSON.stringify(run.feedback, null, 2)}
</grader_${i + 1}>
`).join('\n')}
</grader_feedback>

<task>
Synthesize the feedback from all graders into a single, coherent response.

1. STRENGTHS: Select the 3-4 most specific strengths. Prefer those:
   - Mentioned by multiple graders
   - With direct quotes/evidence from the essay
   - Most relevant to the rubric criteria

2. IMPROVEMENTS: Merge overlapping suggestions into 3-4 most actionable items:
   - Combine similar points (e.g., "transitions" and "paragraph flow" are related)
   - Prioritize based on rubric weighting
   - Keep suggestions specific and actionable

3. LANGUAGE TIPS: Consolidate into unique tips, removing duplicates.

Be concise. Preserve the best specific examples and evidence from the original feedback.
Reference the actual essay content when the graders cite evidence.
</task>`;
}

type EssayContext = {
  assignmentTitle?: string;
  assignmentInstructions?: string;
  academicLevel?: string;
  rubric?: string;
  focusAreas?: string[];
  essayContent: string;
};

async function runSynthesisTest(
  model: string,
  essayContext: EssayContext,
  feedbackFromRuns: typeof SAMPLE_FEEDBACK_FROM_RUNS,
): Promise<{
    model: string;
    durationMs: number;
    success: boolean;
    error?: string;
    totalTokens?: number;
    cost?: number;
  }> {
  const provider = getOpenRouterProvider();
  const startTime = Date.now();

  const prompt = buildSynthesisPrompt({
    ...essayContext,
    feedbackFromRuns,
  });

  try {
    const result = await generateObject({
      model: provider.chat(model),
      schema: synthesizedFeedbackSchema,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 2048,
    });

    const durationMs = Date.now() - startTime;
    // OpenRouter returns cost in providerMetadata.openrouter.usage.cost
    const cost = (result.providerMetadata as any)?.openrouter?.usage?.cost;

    return {
      model,
      durationMs,
      success: true,
      totalTokens: result.usage?.totalTokens,
      cost: typeof cost === 'number' ? cost : undefined,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    return {
      model,
      durationMs,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const run = internalAction({
  args: {
    essayId: v.optional(v.id('essays')),
    gradeId: v.optional(v.id('grades')),
    models: v.optional(v.array(v.string())),
    runsPerModel: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const models = args.models ?? [...MODELS_TO_TEST];
    const runsPerModel = args.runsPerModel ?? RUNS_PER_MODEL;

    // Load essay data from database if IDs provided
    let essayContext: EssayContext;
    const feedbackFromRuns = SAMPLE_FEEDBACK_FROM_RUNS;
    let essaySource = 'sample data';

    if (args.gradeId) {
      // Load from grade (includes essay reference)
      const grade = await ctx.runQuery(internal.grades.getInternal, { gradeId: args.gradeId });
      if (!grade) {
        throw new Error(`Grade not found: ${args.gradeId}`);
      }

      const essay = await ctx.runQuery(internal.essays.getInternal, { essayId: grade.essayId });
      if (!essay) {
        throw new Error(`Essay not found for grade: ${args.gradeId}`);
      }

      essayContext = {
        assignmentTitle: essay.assignmentBrief?.title,
        assignmentInstructions: essay.assignmentBrief?.instructions,
        academicLevel: essay.assignmentBrief?.academicLevel,
        rubric: essay.rubric?.customCriteria,
        focusAreas: essay.focusAreas ?? essay.rubric?.focusAreas,
        essayContent: essay.content ?? '',
      };
      essaySource = `grade ${args.gradeId} -> essay ${grade.essayId}`;
      // NOTE: Grader feedback is still sample data - see file header comment
    } else if (args.essayId) {
      // Load from essay directly
      const essay = await ctx.runQuery(internal.essays.getInternal, { essayId: args.essayId });
      if (!essay) {
        throw new Error(`Essay not found: ${args.essayId}`);
      }

      essayContext = {
        assignmentTitle: essay.assignmentBrief?.title,
        assignmentInstructions: essay.assignmentBrief?.instructions,
        academicLevel: essay.assignmentBrief?.academicLevel,
        rubric: essay.rubric?.customCriteria,
        focusAreas: essay.focusAreas ?? essay.rubric?.focusAreas,
        essayContent: essay.content ?? '',
      };
      essaySource = `essay ${args.essayId}`;
    } else {
      // Use sample essay content for standalone testing
      essayContext = {
        assignmentTitle: 'The Industrial Revolution and Social Change',
        assignmentInstructions: 'Analyze the impact of the Industrial Revolution on British society. Your essay should discuss economic, social, and political changes. Use primary and secondary sources to support your arguments.',
        academicLevel: 'undergraduate',
        rubric: `Marking Criteria:
- Thesis clarity and argument development (30%)
- Use of evidence and sources (25%)
- Analysis depth and critical thinking (25%)
- Writing quality and organization (20%)`,
        focusAreas: ['Historical analysis', 'Source integration', 'Argument structure'],
        essayContent: `The Industrial Revolution fundamentally transformed British society between 1760 and 1840. This essay argues that technological innovation, rather than political reform, drove the most significant social changes during this period.

The introduction of mechanized textile production in Lancashire mills exemplifies this transformation. Factory workers, many of them women and children, faced harsh conditions that stood in stark contrast to traditional cottage industry. As one contemporary observer noted, "the children are confined to sedentary occupations, and often in unwholesome situations."

The economic impact was equally profound. Traditional artisan crafts gave way to mass production, creating new wealth but also new forms of poverty. The enclosure movement displaced rural workers, forcing them into urban centers unprepared for such rapid population growth.

In conclusion, while political reformers eventually addressed some industrial abuses, the fundamental reshaping of British society was driven by technological change rather than deliberate policy. The legacy of this transformation continues to influence modern debates about automation and economic disruption.`,
      };
    }

    // Calculate approximate input size
    const samplePrompt = buildSynthesisPrompt({
      ...essayContext,
      feedbackFromRuns,
    });
    const approxInputChars = samplePrompt.length;

    console.log('='.repeat(60));
    console.log('SYNTHESIS TIMING EXPERIMENT');
    console.log('='.repeat(60));
    console.log(`Essay source: ${essaySource}`);
    console.log(`Essay length: ${essayContext.essayContent.length} chars`);
    console.log(`Approx prompt size: ${approxInputChars} chars (~${Math.round(approxInputChars / 4)} tokens)`);
    console.log(`Models: ${models.join(', ')}`);
    console.log(`Runs per model: ${runsPerModel}`);
    console.log('='.repeat(60));

    const allResults: Array<{
      model: string;
      run: number;
      durationMs: number;
      success: boolean;
      error?: string;
      totalTokens?: number;
      cost?: number;
    }> = [];

    // Run tests sequentially to get accurate timings
    for (const model of models) {
      console.log(`\nTesting: ${model}`);
      console.log('-'.repeat(40));

      for (let i = 1; i <= runsPerModel; i++) {
        const result = await runSynthesisTest(model, essayContext, feedbackFromRuns);
        allResults.push({ ...result, run: i });

        if (result.success) {
          const costStr = result.cost ? ` $${result.cost.toFixed(4)}` : '';
          console.log(`  Run ${i}: ${result.durationMs}ms (${result.totalTokens ?? '?'} tokens${costStr})`);
        } else {
          console.log(`  Run ${i}: FAILED - ${result.error}`);
        }
      }
    }

    // Calculate summary statistics
    console.log(`\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log('='.repeat(60));

    const summaryByModel: Record<string, {
      model: string;
      runs: number;
      successes: number;
      avgMs: number;
      minMs: number;
      maxMs: number;
      avgCost: number;
    }> = {};

    for (const model of models) {
      const modelResults = allResults.filter(r => r.model === model);
      const successfulRuns = modelResults.filter(r => r.success);
      const durations = successfulRuns.map(r => r.durationMs);
      const costs = successfulRuns.map(r => r.cost ?? 0).filter(c => c > 0);

      summaryByModel[model] = {
        model,
        runs: modelResults.length,
        successes: successfulRuns.length,
        avgMs: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
        minMs: durations.length > 0 ? Math.min(...durations) : 0,
        maxMs: durations.length > 0 ? Math.max(...durations) : 0,
        avgCost: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
      };
    }

    // Sort by average time
    const sortedSummary = Object.values(summaryByModel).sort((a, b) => a.avgMs - b.avgMs);

    console.log('\nModel                              | Avg     | Min     | Max     | Cost    | Success');
    console.log('-'.repeat(90));

    for (const s of sortedSummary) {
      const modelName = s.model.padEnd(34);
      const avg = `${s.avgMs}ms`.padEnd(7);
      const min = `${s.minMs}ms`.padEnd(7);
      const max = `${s.maxMs}ms`.padEnd(7);
      const cost = s.avgCost > 0 ? `$${s.avgCost.toFixed(4)}`.padEnd(7) : 'N/A    ';
      const success = `${s.successes}/${s.runs}`;
      console.log(`${modelName} | ${avg} | ${min} | ${max} | ${cost} | ${success}`);
    }

    // Total cost estimate
    const totalCost = allResults.reduce((sum, r) => sum + (r.cost ?? 0), 0);
    console.log(`\nTotal experiment cost: $${totalCost.toFixed(4)}`);
    console.log(`${'='.repeat(60)}`);

    return {
      essaySource,
      essayLength: essayContext.essayContent.length,
      promptSize: approxInputChars,
      results: allResults,
      summary: sortedSummary,
      totalCost,
    };
  },
});
