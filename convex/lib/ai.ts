// AI Client Library
// OpenRouter integration via official OpenRouter AI SDK provider
// Used in Convex actions (serverless environment)

import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// =============================================================================
// OpenRouter Provider Metadata Types
// =============================================================================

/**
 * OpenRouter provider metadata structure returned by AI SDK
 * Full docs: https://openrouter.ai/docs#responses
 *
 * Note: This is a subset of the full response - only the fields we use.
 * OpenRouter returns this in the `providerMetadata` field of AI SDK results.
 */
export type OpenRouterProviderMetadata = {
  openrouter?: {
    usage?: {
      /** Cost in USD for this API call */
      cost?: number;
    };
  };
};

/**
 * Safely extracts the cost from OpenRouter provider metadata
 *
 * The AI SDK returns provider-specific metadata in the `providerMetadata` field,
 * typed as `Record<string, unknown>`. This helper provides type-safe extraction
 * of the cost value from OpenRouter's response format.
 *
 * @param metadata - The `providerMetadata` field from an AI SDK result
 * @returns The cost in USD, or undefined if not available
 *
 * @example
 * const result = await generateObject({ model, schema, prompt });
 * const cost = extractOpenRouterCost(result.providerMetadata);
 * if (cost !== undefined) {
 *   console.log(`API cost: $${cost.toFixed(4)}`);
 * }
 */
export function extractOpenRouterCost(metadata: unknown): number | undefined {
  if (typeof metadata !== 'object' || metadata === null) {
    return undefined;
  }
  const typed = metadata as OpenRouterProviderMetadata;
  const cost = typed.openrouter?.usage?.cost;
  return typeof cost === 'number' ? cost : undefined;
}

/**
 * Get OpenRouter provider configured for AI grading
 * Uses the official @openrouter/ai-sdk-provider for proper model support
 *
 * Note: This runs in Convex actions, so we use process.env directly
 */
export function getOpenRouterProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is required for AI grading. Set it in your Convex environment variables.',
    );
  }

  // Use the official OpenRouter provider
  // This properly handles different model providers (Anthropic, OpenAI, X.AI, etc.)
  return createOpenRouter({
    apiKey,
    headers: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://markm8.com',
      'X-Title': 'MarkM8 AI Grading',
      // Enable Anthropic structured outputs beta (required for Claude models)
      // This header is ignored by non-Anthropic models
      'x-anthropic-beta': 'structured-outputs-2025-11-13',
    },
  });
}

/**
 * Get a model instance for grading
 * @param modelId - OpenRouter model ID (e.g., "x-ai/grok-4.1-fast", "anthropic/claude-haiku-4.5")
 */
export function getGradingModel(modelId: string) {
  const provider = getOpenRouterProvider();
  return provider.chat(modelId, {
    usage: { include: true },
  });
}
