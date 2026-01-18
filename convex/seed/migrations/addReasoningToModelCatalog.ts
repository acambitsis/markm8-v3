// Migration: Add reasoning fields to existing modelCatalog entries
// Added in: PR #85
//
// This migration adds supportsReasoning, reasoningRequired, and defaultReasoningEffort
// fields to existing model catalog entries.
//
// Usage:
//   npx convex run seed/migrations/addReasoningToModelCatalog:migrate
//   npx convex run seed/migrations/addReasoningToModelCatalog:migrate --prod
//
// Idempotent - safe to run multiple times (checks if fields already exist).

/* eslint-disable no-console -- Migration scripts use console for Convex logs */

import { internalMutation } from '../../_generated/server';
import type { ReasoningEffort } from '../../schema';

// Reasoning configuration for known models
// Note: x-ai/grok-4 has built-in reasoning but doesn't accept the reasoning_effort parameter,
// so it's intentionally excluded from this config.
const MODEL_REASONING_CONFIG: Record<string, {
  supportsReasoning: boolean;
  reasoningRequired: boolean;
  defaultReasoningEffort?: ReasoningEffort;
}> = {
  // OpenAI - GPT-5.2 requires reasoning effort parameter
  'openai/gpt-5.2-pro': {
    supportsReasoning: true,
    reasoningRequired: true,
    defaultReasoningEffort: 'medium',
  },
  // Google - Gemini 3 Pro requires reasoning, Flash is optional
  'google/gemini-3-pro-preview': {
    supportsReasoning: true,
    reasoningRequired: true,
    defaultReasoningEffort: 'high',
  },
  'google/gemini-3-flash-preview': {
    supportsReasoning: true,
    reasoningRequired: false,
    defaultReasoningEffort: 'medium',
  },
  // Anthropic - Claude models support optional reasoning
  'anthropic/claude-opus-4.5': {
    supportsReasoning: true,
    reasoningRequired: false,
    defaultReasoningEffort: 'medium',
  },
  'anthropic/claude-haiku-4.5': {
    supportsReasoning: true,
    reasoningRequired: false,
    defaultReasoningEffort: 'medium',
  },
  // xAI - Grok 4.1 Fast supports optional reasoning
  // (Grok 4 has built-in reasoning but doesn't accept parameters - excluded)
  'x-ai/grok-4.1-fast': {
    supportsReasoning: true,
    reasoningRequired: false,
    defaultReasoningEffort: 'medium',
  },
};

/**
 * Migrate existing modelCatalog entries to include reasoning fields.
 * Only updates models that have known reasoning configuration.
 */
export const migrate = internalMutation({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query('modelCatalog').take(100);

    if (models.length === 0) {
      console.log('No models found in catalog. Run seed script first.');
      return { status: 'skipped', reason: 'no_models' };
    }

    const results: Array<{ slug: string; status: string }> = [];

    for (const model of models) {
      const config = MODEL_REASONING_CONFIG[model.slug];

      if (!config) {
        // Model doesn't need reasoning config
        results.push({ slug: model.slug, status: 'no_config_needed' });
        continue;
      }

      // Check if already migrated
      if (model.supportsReasoning !== undefined) {
        console.log(`${model.slug}: already has reasoning fields`);
        results.push({ slug: model.slug, status: 'already_migrated' });
        continue;
      }

      // Apply reasoning config
      await ctx.db.patch(model._id, {
        supportsReasoning: config.supportsReasoning,
        reasoningRequired: config.reasoningRequired,
        defaultReasoningEffort: config.defaultReasoningEffort,
      });

      console.log(`${model.slug}: added reasoning fields (required=${config.reasoningRequired})`);
      results.push({ slug: model.slug, status: 'migrated' });
    }

    const migrated = results.filter(r => r.status === 'migrated').length;
    const skipped = results.filter(r => r.status === 'already_migrated').length;

    console.log(`Migration complete: ${migrated} migrated, ${skipped} already had fields`);
    return { status: 'complete', results, migrated, skipped };
  },
});
