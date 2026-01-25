// Feedback Synthesis
// LLM-powered synthesis of feedback from multiple grading runs
// Merges overlapping feedback and selects the most actionable items

import { generateObject } from 'ai';
import { z } from 'zod';

import type { GradeFeedback, SynthesisConfig } from '../../schema';
import { getOpenRouterProvider } from '../ai';
import {
  buildSynthesisPrompt,
  type RawGradingFeedback,
  SYNTHESIS_PROMPT_VERSION,
} from '../synthesisPrompt';

// Re-export for convenience
export type { RawGradingFeedback } from '../synthesisPrompt';
export { SYNTHESIS_PROMPT_VERSION } from '../synthesisPrompt';

// =============================================================================
// Types
// =============================================================================

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
  promptVersion: string;
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
    promptVersion: SYNTHESIS_PROMPT_VERSION,
    cost: typeof cost === 'number' ? cost : undefined,
    totalTokens: result.usage?.totalTokens,
    durationMs,
  };
}
