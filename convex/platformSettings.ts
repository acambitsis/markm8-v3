// Platform settings queries and mutations
// Handles admin-configurable platform values

import { v } from 'convex/values';

import { internalAction, internalMutation, internalQuery } from './_generated/server';

const DEFAULT_SIGNUP_BONUS = '1.00';

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
 * Returns config with defaults if not exists
 * TODO: Implement full config structure and defaults (see TECHNICAL_DESIGN.md)
 */
export const getAiConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    // TODO: Return structured config with defaults
    // For now, return undefined to indicate not yet implemented
    return settings?.aiConfig ?? undefined;
  },
});

/**
 * Update AI model configuration (admin only)
 * TODO: Implement email allowlist check and full config validation
 */
export const updateAiConfig = internalMutation({
  args: {
    aiConfig: v.any(), // TODO: Add proper validator based on AiConfig type
    adminEmail: v.string(), // For allowlist check and audit log
  },
  handler: async (ctx, { aiConfig: _aiConfig, adminEmail: _adminEmail }) => {
    // TODO: Check adminEmail against aiConfig.adminEmails allowlist
    // TODO: Validate aiConfig structure
    // TODO: Update singleton document with new config + audit fields

    const settings = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (settings) {
      // TODO: Implement update
      // await ctx.db.patch(settings._id, {
      //   aiConfig,
      //   // lastUpdatedBy: adminEmail,
      //   // lastUpdatedAt: Date.now(),
      // });
    } else {
      // TODO: Create singleton if doesn't exist
    }

    // Stub: return success for now
    return { success: true };
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
