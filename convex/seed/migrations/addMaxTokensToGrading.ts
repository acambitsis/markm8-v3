// Migration: Add maxTokens to existing platformSettings.aiConfig.grading
//
// This migration adds the maxTokens field to existing platformSettings records
// that were created before this field was added to the schema.
//
// Usage:
//   npx convex run seed/migrations/addMaxTokensToGrading:migrate
//   npx convex run seed/migrations/addMaxTokensToGrading:migrate --prod
//
// This is idempotent - safe to run multiple times.

/* eslint-disable no-console -- Migration scripts use console for Convex logs */

import { internalMutation } from '../../_generated/server';
import { DEFAULT_GRADING_CONFIG } from '../../lib/aiConfig';

/**
 * Migrate existing platformSettings to include maxTokens in grading config.
 * Uses the default value from DEFAULT_GRADING_CONFIG for consistency.
 */
export const migrate = internalMutation({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (!settings) {
      console.log('No platformSettings found. Run seed script first.');
      return { status: 'skipped', reason: 'no_settings' };
    }

    // Check if maxTokens already exists
    if (settings.aiConfig.grading.maxTokens !== undefined) {
      console.log('maxTokens already set:', settings.aiConfig.grading.maxTokens);
      return { status: 'skipped', reason: 'already_set', value: settings.aiConfig.grading.maxTokens };
    }

    // Add maxTokens using the default from aiConfig
    const defaultMaxTokens = DEFAULT_GRADING_CONFIG.maxTokens;
    const updatedAiConfig = {
      ...settings.aiConfig,
      grading: {
        ...settings.aiConfig.grading,
        maxTokens: defaultMaxTokens,
      },
    };

    await ctx.db.patch(settings._id, {
      aiConfig: updatedAiConfig,
    });

    console.log('Migration complete: added maxTokens =', defaultMaxTokens);
    return { status: 'migrated', maxTokens: defaultMaxTokens };
  },
});
