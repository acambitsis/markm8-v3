// Migration: Add reasoning fields to existing modelCatalog entries
//
// This migration adds supportsReasoning, reasoningRequired, and defaultReasoningEffort
// fields to existing model catalog entries that were created before PR #85.
//
// Usage:
//   npx convex run seed/migrations/addReasoningToModelCatalog:migrate
//   npx convex run seed/migrations/addReasoningToModelCatalog:migrate --prod
//
// This is idempotent - safe to run multiple times.

/* eslint-disable no-console -- Migration scripts use console for Convex logs */

import { internalMutation } from '../../_generated/server';
import type { ReasoningEffort } from '../../schema';

// Reasoning configuration for known models
const MODEL_REASONING_CONFIG: Record<string, {
  supportsReasoning: boolean;
  reasoningRequired: boolean;
  defaultReasoningEffort: ReasoningEffort;
}> = {
  'openai/gpt-5.2-pro': {
    supportsReasoning: true,
    reasoningRequired: true,
    defaultReasoningEffort: 'medium',
  },
  'x-ai/grok-4': {
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
