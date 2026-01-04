// Platform settings queries and mutations
// Handles admin-configurable platform values

import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { validateAiConfig } from './lib/aiConfig';
import { type AiConfig, aiConfigValidator } from './schema';

export const DEFAULT_SIGNUP_BONUS = '1.00';

/**
 * Get platform settings (internal use)
 * Returns singleton with defaults if not exists
 */
export const get = internalQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (!settings) {
      // Return defaults if singleton doesn't exist
      return {
        signupBonusAmount: DEFAULT_SIGNUP_BONUS,
      };
    }

    return {
      signupBonusAmount: settings.signupBonusAmount,
    };
  },
});

/**
 * Get signup bonus amount (convenience function for webhooks)
 */
export const getSignupBonus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    return settings?.signupBonusAmount ?? DEFAULT_SIGNUP_BONUS;
  },
});

/**
 * Get AI model configuration (internal use)
 * Returns validated config from database, or throws if not seeded
 *
 * Run seed script to initialize: npx convex run seed/platformSettings:seed
 */
export const getAiConfig = internalQuery({
  args: {},
  handler: async (ctx): Promise<AiConfig> => {
    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (!settings) {
      // Fail fast - don't silently use defaults (which include mode: 'mock')
      throw new Error(
        'platformSettings not found. Run seed script: npx convex run seed/platformSettings:seed',
      );
    }

    const config = settings.aiConfig;
    const validation = validateAiConfig(config);

    // Log warnings (non-fatal, config still usable)
    for (const warning of validation.warnings) {
      console.warn(`[aiConfig] ${warning}`);
    }

    // Throw on critical errors (config unusable)
    if (!validation.valid) {
      const errorMsg = validation.errors.join('; ');
      console.error(`[aiConfig] Invalid configuration: ${errorMsg}`);
      throw new Error(`Invalid AI configuration: ${errorMsg}`);
    }

    return config;
  },
});

/**
 * Update AI model configuration (admin only)
 * Validates config before saving; throws on invalid configuration
 */
export const updateAiConfig = internalMutation({
  args: {
    aiConfig: aiConfigValidator,
  },
  handler: async (ctx, { aiConfig }) => {
    // Validate before saving
    const validation = validateAiConfig(aiConfig);
    if (!validation.valid) {
      const errorMsg = validation.errors.join('; ');
      throw new Error(`Invalid AI configuration: ${errorMsg}`);
    }

    // Log warnings
    for (const warning of validation.warnings) {
      console.warn(`[aiConfig] ${warning}`);
    }

    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (settings) {
      await ctx.db.patch(settings._id, { aiConfig });
    } else {
      // Create singleton if doesn't exist (shouldn't happen if seeded)
      await ctx.db.insert('platformSettings', {
        key: 'singleton',
        signupBonusAmount: DEFAULT_SIGNUP_BONUS,
        aiConfig,
      });
    }

    return { success: true, warnings: validation.warnings };
  },
});

/**
 * Refresh AI model catalog from OpenRouter (internal action)
 * Fetches latest models and validates configured model IDs
 * TODO: Implement OpenRouter API call and validation logic
 */
export const refreshAiModelCatalog = internalAction({
  args: {},
  handler: async (_ctx) => {
    // TODO: Fetch from https://openrouter.ai/api/v1/models
    // TODO: Validate existing aiConfig model IDs exist
    // TODO: Suggest updates if newer SOTA models available
    // TODO: Return catalog + validation results (does NOT auto-update)

    return {
      catalog: [],
      validationResults: [],
      suggestions: [],
    };
  },
});
