// Migration: Add synthesis config to existing platformSettings.aiConfig
// Added in: PR #100
//
// This migration adds the synthesis configuration to existing platformSettings records.
//
// Usage:
//   npx convex run seed/migrations/addSynthesisConfig:migrate
//   npx convex run seed/migrations/addSynthesisConfig:migrate --prod
//
// Idempotent - safe to run multiple times (checks if field already exists).

/* eslint-disable no-console -- Migration scripts use console for Convex logs */

import { internalMutation } from '../../_generated/server';
import { DEFAULT_SYNTHESIS_CONFIG } from '../../lib/aiConfig';

/**
 * Migrate existing platformSettings to include synthesis in aiConfig.
 * Uses the default value from DEFAULT_SYNTHESIS_CONFIG for consistency.
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

    // Check if synthesis config already exists
    if (settings.aiConfig.synthesis !== undefined) {
      console.log('synthesis config already set:', JSON.stringify(settings.aiConfig.synthesis));
      return { status: 'skipped', reason: 'already_set', config: settings.aiConfig.synthesis };
    }

    // Add synthesis config using the default from aiConfig
    const updatedAiConfig = {
      ...settings.aiConfig,
      synthesis: DEFAULT_SYNTHESIS_CONFIG,
    };

    await ctx.db.patch(settings._id, {
      aiConfig: updatedAiConfig,
    });

    console.log('Migration complete: added synthesis config =', JSON.stringify(DEFAULT_SYNTHESIS_CONFIG));
    return { status: 'migrated', synthesis: DEFAULT_SYNTHESIS_CONFIG };
  },
});
