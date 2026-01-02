// AI Client Library
// OpenRouter integration via Vercel AI SDK
// Used in Convex actions (serverless environment)

import { createOpenAI } from '@ai-sdk/openai';

/**
 * Get OpenRouter provider configured for AI grading
 * Uses OpenAI-compatible API via @ai-sdk/openai with OpenRouter base URL
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

  // Configure OpenAI provider to use OpenRouter
  // OpenRouter is OpenAI-compatible, so we can use @ai-sdk/openai
  return createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
    // OpenRouter-specific headers (optional, for analytics)
    headers: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://markm8.com',
      'X-Title': 'MarkM8 AI Grading',
    },
  });
}

/**
 * Get a model instance for grading
 * @param modelId - OpenRouter model ID (e.g., "x-ai/grok-4.1", "anthropic/claude-opus-4.5")
 */
export function getGradingModel(modelId: string) {
  const provider = getOpenRouterProvider();
  return provider(modelId);
}
