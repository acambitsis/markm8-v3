// Feedback Synthesis
// LLM-powered synthesis of feedback from multiple grading runs
// Merges overlapping feedback and selects the most actionable items

import { generateObject } from 'ai';
import { z } from 'zod';

import type { GradeFeedback, SynthesisConfig } from '../../schema';
import { getOpenRouterProvider } from '../ai';

// =============================================================================
// Types
// =============================================================================

/**
 * Raw feedback from a single grading run (includes model and percentage for context)
 */
export type RawGradingFeedback = {
  model: string;
  percentage: number;
  feedback: GradeFeedback;
};

/**
 * Input for synthesis
 */
export type SynthesisInput = {
  assignmentTitle?: string;
  assignmentInstructions?: string;
  academicLevel?: string;
  rubric?: string;
  focusAreas?: string[];
  essayContent: string;
  feedbackFromRuns: RawGradingFeedback[];
};

/**
 * Result of synthesis
 */
export type SynthesisResult = {
  feedback: GradeFeedback;
  cost?: number;
  totalTokens?: number;
  durationMs: number;
};

// =============================================================================
// Schema for AI Output
// =============================================================================

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
    detailedSuggestions: z.array(z.string()).optional(),
  })).describe('3-4 most actionable improvements, merged if overlapping'),
  languageTips: z.array(z.object({
    category: z.string(),
    feedback: z.string(),
  })).describe('Consolidated language tips, no duplicates'),
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
    description: z.string(),
  })).optional().describe('Optional learning resources'),
});

// =============================================================================
// Prompt Builder
// =============================================================================

/**
 * Builds the synthesis prompt with full essay context using XML delimiters
 */
function buildSynthesisPrompt(input: SynthesisInput): string {
  const {
    assignmentTitle,
    assignmentInstructions,
    academicLevel,
    rubric,
    focusAreas,
    essayContent,
    feedbackFromRuns,
  } = input;

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

4. RESOURCES: If any graders suggested resources, include the most relevant 1-2.

Be concise. Preserve the best specific examples and evidence from the original feedback.
Reference the actual essay content when the graders cite evidence.
</task>`;
}

// =============================================================================
// Synthesis Function
// =============================================================================

/**
 * Run LLM-powered feedback synthesis
 *
 * @param input - Essay context and feedback from grading runs
 * @param config - Synthesis configuration (model, temperature, maxTokens)
 * @returns Synthesized feedback with cost and timing info
 */
export async function runSynthesis(
  input: SynthesisInput,
  config: SynthesisConfig,
): Promise<SynthesisResult> {
  const startTime = Date.now();
  const provider = getOpenRouterProvider();

  const prompt = buildSynthesisPrompt(input);

  const result = await generateObject({
    model: provider.chat(config.model),
    schema: synthesizedFeedbackSchema,
    prompt,
    temperature: config.temperature,
    maxOutputTokens: config.maxTokens,
  });

  const durationMs = Date.now() - startTime;

  // Extract cost from OpenRouter provider metadata
  const cost = (result.providerMetadata as any)?.openrouter?.usage?.cost;

  // Convert schema output to GradeFeedback type
  const feedback: GradeFeedback = {
    strengths: result.object.strengths,
    improvements: result.object.improvements,
    languageTips: result.object.languageTips,
    resources: result.object.resources,
  };

  return {
    feedback,
    cost: typeof cost === 'number' ? cost : undefined,
    totalTokens: result.usage?.totalTokens,
    durationMs,
  };
}
