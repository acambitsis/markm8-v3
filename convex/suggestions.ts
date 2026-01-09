// AI Suggestions
// Generates title and subject suggestions from essay content

import { generateText } from 'ai';
import { v } from 'convex/values';

import { internal } from './_generated/api';
import { action } from './_generated/server';
import { getOpenRouterProvider } from './lib/ai';
import { getAuthIdentity } from './lib/auth';

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 suggestions per minute

/**
 * Generate title and subject suggestions from essay content
 * Uses the titleGeneration config from platformSettings
 *
 * Returns suggested title and subject based on essay content analysis
 */
export const generateSuggestions = action({
  args: {
    content: v.string(), // Essay content (will use first ~2000 chars)
  },
  handler: async (ctx, { content }): Promise<{
    title: string;
    subject: string;
  }> => {
    // Auth check (actions use getAuthIdentity since they don't have ctx.db)
    const identity = await getAuthIdentity(ctx);

    // Get user ID for rate limiting
    const user = await ctx.runQuery(internal.documents.getUserByClerkId, {
      clerkId: identity.clerkId,
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Rate limit check (reuse documents rate limiting infrastructure)
    const isAllowed = await ctx.runQuery(internal.documents.checkRateLimit, {
      userId: user._id,
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
    });

    if (!isAllowed) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }

    // Get AI config
    const aiConfig = await ctx.runQuery(
      internal.platformSettings.getAiConfig,
      {},
    );
    const config = aiConfig.titleGeneration;

    // Truncate content to ~2000 chars to keep prompt small
    const truncatedContent = content.slice(0, 2000);

    // Build prompt
    const prompt = `Analyze this essay excerpt and provide:
1. A concise, descriptive title (5-10 words, no quotes)
2. The academic subject area (e.g., "English Literature", "History", "Psychology", "Biology", "Computer Science", "Business", "Philosophy", "Art History", "Economics", "Sociology", "Political Science")

Essay excerpt:
---
${truncatedContent}
---

Respond in this exact JSON format only, no other text:
{"title": "Your Suggested Title Here", "subject": "Subject Area"}`;

    try {
      const provider = getOpenRouterProvider();
      const model = provider(config.model);

      const result = await generateText({
        model,
        prompt,
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens * 3, // Allow more tokens for JSON structure
      });

      // Parse the JSON response
      const text = result.text.trim();

      // Try to extract JSON from the response (non-greedy to match first valid JSON object)
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as { title: string; subject: string };

      // Validate response structure
      if (!parsed.title || typeof parsed.title !== 'string') {
        throw new Error('Invalid title in response');
      }
      if (!parsed.subject || typeof parsed.subject !== 'string') {
        throw new Error('Invalid subject in response');
      }

      // Record request for rate limiting (reuse documents infrastructure)
      await ctx.runMutation(internal.documents.recordRequest, { userId: user._id });

      return {
        title: parsed.title.trim(),
        subject: parsed.subject.trim(),
      };
    } catch (error) {
      console.error('Failed to generate suggestions:', error);

      // Return empty suggestions on error - UI will handle gracefully
      return {
        title: '',
        subject: '',
      };
    }
  },
});
