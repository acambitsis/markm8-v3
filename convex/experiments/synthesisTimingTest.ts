// Synthesis Timing Experiment
// Tests how long feedback synthesis takes across different models
//
// Usage: npx convex run experiments/synthesisTimingTest:run
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

// Sample feedback from 3 "grading runs" - realistic test data
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

const SYNTHESIS_PROMPT = `You are synthesizing feedback from 3 independent essay graders.

Here is the feedback from each grader:

${JSON.stringify(SAMPLE_FEEDBACK_FROM_RUNS, null, 2)}

Your task:
1. STRENGTHS: Select the 3-4 most specific strengths with the strongest evidence. Prefer those mentioned by multiple graders or with direct quotes.
2. IMPROVEMENTS: Merge overlapping suggestions (e.g., "transitions" and "paragraph transitions" are the same). Keep 3-4 most actionable.
3. LANGUAGE TIPS: Consolidate into unique tips, removing duplicates.

Be concise. Preserve the best specific examples and evidence from the original feedback.`;

async function runSynthesisTest(model: string): Promise<{
  model: string;
  durationMs: number;
  success: boolean;
  error?: string;
  outputTokens?: number;
}> {
  const provider = getOpenRouterProvider();
  const startTime = Date.now();

  try {
    const result = await generateObject({
      model: provider.chat(model),
      schema: synthesizedFeedbackSchema,
      prompt: SYNTHESIS_PROMPT,
      temperature: 0.3,
      maxOutputTokens: 2048,
    });

    const durationMs = Date.now() - startTime;

    return {
      model,
      durationMs,
      success: true,
      outputTokens: result.usage?.outputTokens,
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
    models: v.optional(v.array(v.string())),
    runsPerModel: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const models = args.models ?? [...MODELS_TO_TEST];
    const runsPerModel = args.runsPerModel ?? RUNS_PER_MODEL;

    console.log('='.repeat(60));
    console.log('SYNTHESIS TIMING EXPERIMENT');
    console.log('='.repeat(60));
    console.log(`Models: ${models.join(', ')}`);
    console.log(`Runs per model: ${runsPerModel}`);
    console.log('='.repeat(60));

    const allResults: Array<{
      model: string;
      run: number;
      durationMs: number;
      success: boolean;
      error?: string;
      outputTokens?: number;
    }> = [];

    // Run tests sequentially to get accurate timings
    for (const model of models) {
      console.log(`\nTesting: ${model}`);
      console.log('-'.repeat(40));

      for (let i = 1; i <= runsPerModel; i++) {
        const result = await runSynthesisTest(model);
        allResults.push({ ...result, run: i });

        if (result.success) {
          console.log(`  Run ${i}: ${result.durationMs}ms (${result.outputTokens} tokens)`);
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
    }> = {};

    for (const model of models) {
      const modelResults = allResults.filter(r => r.model === model);
      const successfulRuns = modelResults.filter(r => r.success);
      const durations = successfulRuns.map(r => r.durationMs);

      summaryByModel[model] = {
        model,
        runs: modelResults.length,
        successes: successfulRuns.length,
        avgMs: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
        minMs: durations.length > 0 ? Math.min(...durations) : 0,
        maxMs: durations.length > 0 ? Math.max(...durations) : 0,
      };
    }

    // Sort by average time
    const sortedSummary = Object.values(summaryByModel).sort((a, b) => a.avgMs - b.avgMs);

    console.log('\nModel                              | Avg     | Min     | Max     | Success');
    console.log('-'.repeat(80));

    for (const s of sortedSummary) {
      const modelName = s.model.padEnd(34);
      const avg = `${s.avgMs}ms`.padEnd(7);
      const min = `${s.minMs}ms`.padEnd(7);
      const max = `${s.maxMs}ms`.padEnd(7);
      const success = `${s.successes}/${s.runs}`;
      console.log(`${modelName} | ${avg} | ${min} | ${max} | ${success}`);
    }

    console.log(`\n${'='.repeat(60)}`);

    return {
      results: allResults,
      summary: sortedSummary,
    };
  },
});
