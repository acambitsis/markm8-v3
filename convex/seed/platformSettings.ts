// Platform Settings Seeding Script
// Initialize or reset platformSettings with AI configuration
//
// Usage:
//   Dev:  npx convex run seed/platformSettings:seed
//   Prod: npx convex run seed/platformSettings:seed '{"isProd": true}'
//   Reset: npx convex run seed/platformSettings:reset

/* eslint-disable no-console -- Seed scripts use console for Convex logs */

import { v } from 'convex/values';

import { internalMutation } from '../_generated/server';
import { DEFAULT_AI_CONFIG, validateAiConfig } from '../lib/aiConfig';
import { DEFAULT_SIGNUP_BONUS } from '../platformSettings';
import type { AiConfig } from '../schema';

// Production configuration overrides
// Mixed models for better consensus accuracy
const PROD_AI_CONFIG: AiConfig = {
  grading: {
    mode: 'live',
    temperature: 0.4,
    runs: [
      { model: 'x-ai/grok-4.1' },
      { model: 'x-ai/grok-4.1' },
      { model: 'openai/gpt-4o' },
      { model: 'openai/gpt-4o' },
      { model: 'anthropic/claude-sonnet-4' },
    ],
    outlierThresholdPercent: 10,
    retry: {
      maxRetries: 3,
      backoffMs: [5000, 15000, 45000],
    },
  },
  titleGeneration: {
    model: 'openai/gpt-4o-mini',
    temperature: 0.4,
    maxTokens: 14,
  },
};

/**
 * Seed platform settings with AI configuration
 * Creates singleton if not exists, skips if already seeded
 *
 * @param isProd - If true, uses production config (live mode, mixed models)
 */
export const seed = internalMutation({
  args: {
    isProd: v.optional(v.boolean()),
  },
  handler: async (ctx, { isProd = false }) => {
    const existing = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (existing) {
      console.log('platformSettings already exists, skipping seed');
      console.log('Current aiConfig:', JSON.stringify(existing.aiConfig, null, 2));
      return { status: 'skipped', id: existing._id };
    }

    const aiConfig = isProd ? PROD_AI_CONFIG : DEFAULT_AI_CONFIG;

    // Validate config before inserting
    const validation = validateAiConfig(aiConfig);
    if (!validation.valid) {
      throw new Error(`Invalid AI config: ${validation.errors.join('; ')}`);
    }
    for (const warning of validation.warnings) {
      console.warn(`[seed] ${warning}`);
    }

    const id = await ctx.db.insert('platformSettings', {
      key: 'singleton',
      signupBonusAmount: DEFAULT_SIGNUP_BONUS,
      aiConfig,
    });

    console.log(`Seeded platformSettings (isProd=${isProd})`);
    console.log('aiConfig:', JSON.stringify(aiConfig, null, 2));

    return { status: 'created', id };
  },
});

/**
 * Reset platform settings and re-seed
 * Deletes existing singleton and creates fresh one
 *
 * WARNING: This will reset all platform settings including signup bonus
 */
export const reset = internalMutation({
  args: {
    isProd: v.optional(v.boolean()),
  },
  handler: async (ctx, { isProd = false }) => {
    const existing = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (existing) {
      console.log('Deleting existing platformSettings...');
      await ctx.db.delete(existing._id);
    }

    // Create new with specified config
    const aiConfig = isProd ? PROD_AI_CONFIG : DEFAULT_AI_CONFIG;

    // Validate config before inserting
    const validation = validateAiConfig(aiConfig);
    if (!validation.valid) {
      throw new Error(`Invalid AI config: ${validation.errors.join('; ')}`);
    }
    for (const warning of validation.warnings) {
      console.warn(`[reset] ${warning}`);
    }

    const id = await ctx.db.insert('platformSettings', {
      key: 'singleton',
      signupBonusAmount: DEFAULT_SIGNUP_BONUS,
      aiConfig,
    });

    console.log(`Reset platformSettings (isProd=${isProd})`);
    console.log('aiConfig:', JSON.stringify(aiConfig, null, 2));

    return { status: 'reset', id };
  },
});

/**
 * Update only the AI config portion of platform settings
 * Preserves other settings like signupBonusAmount
 */
export const updateAiConfigOnly = internalMutation({
  args: {
    isProd: v.optional(v.boolean()),
  },
  handler: async (ctx, { isProd = false }) => {
    const existing = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    const aiConfig = isProd ? PROD_AI_CONFIG : DEFAULT_AI_CONFIG;

    // Validate config before inserting/updating
    const validation = validateAiConfig(aiConfig);
    if (!validation.valid) {
      throw new Error(`Invalid AI config: ${validation.errors.join('; ')}`);
    }
    for (const warning of validation.warnings) {
      console.warn(`[updateAiConfigOnly] ${warning}`);
    }

    if (existing) {
      await ctx.db.patch(existing._id, { aiConfig });
      console.log(`Updated aiConfig (isProd=${isProd})`);
      console.log('aiConfig:', JSON.stringify(aiConfig, null, 2));
      return { status: 'updated', id: existing._id };
    } else {
      // Create if doesn't exist
      const id = await ctx.db.insert('platformSettings', {
        key: 'singleton',
        signupBonusAmount: DEFAULT_SIGNUP_BONUS,
        aiConfig,
      });
      console.log(`Created platformSettings with aiConfig (isProd=${isProd})`);
      return { status: 'created', id };
    }
  },
});
