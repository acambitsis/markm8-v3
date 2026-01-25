// Feedback Synthesis
// LLM-powered synthesis of feedback from multiple grading runs
// Merges overlapping feedback and selects the most actionable items

import { generateObject } from 'ai';
import { z } from 'zod';

import type { GradeFeedback, SynthesisConfig } from '../../schema';
import { getGradingModel } from '../ai';
import {
  buildSynthesisPrompt,
  type RawGradingFeedback,
  SYNTHESIS_PROMPT_VERSION,
} from '../synthesisPrompt';
import { retryWithBackoff } from './utils';

// Re-export for convenience
export type { RawGradingFeedback } from '../synthesisPrompt';
export { SYNTHESIS_PROMPT_VERSION } from '../synthesisPrompt';

// =============================================================================
// Types
// =============================================================================

/**
 * OpenRouter provider metadata structure (subset we care about)
 * Full docs: https://openrouter.ai/docs#responses
 */
type OpenRouterProviderMetadata = {
  openrouter?: {
    usage?: {
      cost?: number;
    };
  };
};

/**
 * Safely extract cost from OpenRouter provider metadata
 */
function extractCostFromMetadata(metadata: unknown): number | undefined {
  if (typeof metadata !== 'object' || metadata === null) {
    return undefined;
  }
  const typed = metadata as OpenRouterProviderMetadata;
  const cost = typed.openrouter?.usage?.cost;
  return typeof cost === 'number' ? cost : undefined;
}

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

// Note: Using .nullable() instead of .optional() for OpenAI strict JSON schema compatibility.
// Strict mode requires all properties in 'required' array; nullable allows null values.
const synthesizedFeedbackSchema = z.object({
  strengths: z.array(z.object({
    title: z.string(),
    description: z.string(),
    evidence: z.string().nullable(),
  })).describe('3-4 best strengths, curated from all runs, with strongest evidence'),
  improvements: z.array(z.object({
    title: z.string(),
    description: z.string(),
    suggestion: z.string(),
    detailedSuggestions: z.array(z.string()).nullable(),
  })).describe('3-4 most actionable improvements, merged if overlapping'),
  languageTips: z.array(z.object({
    category: z.string(),
    feedback: z.string(),
  })).describe('Consolidated language tips, no duplicates'),
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().nullable(),
    description: z.string(),
  })).nullable().describe('Optional learning resources'),
});

// =============================================================================
// Synthesis Function
// =============================================================================

/**
 * Run LLM-powered feedback synthesis
 *
 * Note: Full integration testing requires the Python eval suite (evals/)
 * since this function calls external AI APIs. Unit tests cover prompt
 * construction in synthesis.test.ts.
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
  const model = getGradingModel(config.model);

  const prompt = buildSynthesisPrompt(input);

  // Use retry logic for resilience (same as grading)
  const result = await retryWithBackoff(
    async () => {
      return await generateObject({
        model,
        schema: synthesizedFeedbackSchema,
        prompt,
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
        system: 'You are an expert academic writing coach. Synthesize feedback from multiple AI graders into clear, actionable guidance. Output only the requested structured data.',
      });
    },
    2, // maxRetries - fewer than grading since synthesis is optional
    [3000, 9000], // backoffMs
  );

  const durationMs = Date.now() - startTime;

  // Extract cost from OpenRouter provider metadata
  const cost = extractCostFromMetadata(result.providerMetadata);

  // Convert schema output to GradeFeedback type (null → undefined for optional fields)
  const feedback: GradeFeedback = {
    strengths: result.object.strengths.map(s => ({
      title: s.title,
      description: s.description,
      evidence: s.evidence ?? undefined,
    })),
    improvements: result.object.improvements.map(i => ({
      title: i.title,
      description: i.description,
      suggestion: i.suggestion,
      detailedSuggestions: i.detailedSuggestions ?? undefined,
    })),
    languageTips: result.object.languageTips,
    resources: result.object.resources?.map(r => ({
      title: r.title,
      description: r.description,
      url: r.url ?? undefined,
    })) ?? undefined,
  };

  return {
    feedback,
    promptVersion: SYNTHESIS_PROMPT_VERSION,
    cost: typeof cost === 'number' ? cost : undefined,
    totalTokens: result.usage?.totalTokens,
    durationMs,
  };
}
