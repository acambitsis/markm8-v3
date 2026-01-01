// Platform settings queries and mutations
// Handles admin-configurable platform values

import { internalQuery } from './_generated/server';

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
