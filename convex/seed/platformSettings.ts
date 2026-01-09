// Platform Settings Seeding Script
// Initialize or reset platformSettings with AI configuration
//
// Usage:
//   Dev:  npx convex run seed/platformSettings:seed
//   Prod: npx convex run seed/platformSettings:seed '{"isProd": true}'
//   Reset: npx convex run seed/platformSettings:reset
//   Set pricing: npx convex run seed/platformSettings:setPricing '{"gradingCostPerEssay": "1.00", "creditsPerDollar": "1.00"}'
//
// Admin emails can be passed as argument:
//   npx convex run seed/platformSettings:seed '{"adminEmails": ["admin@example.com"]}'

/* eslint-disable no-console -- Seed scripts use console for Convex logs */

import { v } from 'convex/values';

import { internalMutation } from '../_generated/server';
import { DEFAULT_AI_CONFIG, validateAiConfig } from '../lib/aiConfig';
import { calculatePricePerEssay, validatePricing } from '../lib/pricing';
import type { AiConfig } from '../schema';

// Seed values for new deployments (no hardcoded fallbacks in runtime code)
const SEED_SIGNUP_BONUS = '1.00';
const SEED_GRADING_COST_PER_ESSAY = '1.00';
const SEED_CREDITS_PER_DOLLAR = '1.00';

// Production configuration overrides
// Mixed models for better consensus accuracy
const PROD_AI_CONFIG: AiConfig = {
  grading: {
    mode: 'live',
    temperature: 0.4,
    runs: [
      { model: 'x-ai/grok-4.1-fast' },
      { model: 'x-ai/grok-4.1-fast' },
      { model: 'openai/gpt-5.2-pro' },
      { model: 'openai/gpt-5.2-pro' },
      { model: 'anthropic/claude-opus-4.5' },
    ],
    outlierThresholdPercent: 10,
    retry: {
      maxRetries: 3,
      backoffMs: [5000, 15000, 45000],
    },
    maxTokens: 8192,
  },
  titleGeneration: {
    model: 'anthropic/claude-haiku-4.5',
    temperature: 0.4,
    maxTokens: 14,
  },
};

/**
 * Seed platform settings with AI configuration
 * Creates singleton if not exists, skips if already seeded
 *
 * @param isProd - If true, uses production config (live mode, mixed models)
 * @param adminEmails - Initial admin email allowlist (optional)
 */
export const seed = internalMutation({
  args: {
    isProd: v.optional(v.boolean()),
    adminEmails: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { isProd = false, adminEmails }) => {
    const existing = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (existing) {
      console.log('platformSettings already exists, skipping seed');
      console.log('Current aiConfig:', JSON.stringify(existing.aiConfig, null, 2));
      console.log('Current adminEmails:', existing.adminEmails ?? []);
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

    // Normalize admin emails to lowercase
    const normalizedEmails = adminEmails?.map(e => e.toLowerCase().trim());

    const id = await ctx.db.insert('platformSettings', {
      key: 'singleton',
      signupBonusAmount: SEED_SIGNUP_BONUS,
      gradingCostPerEssay: SEED_GRADING_COST_PER_ESSAY,
      creditsPerDollar: SEED_CREDITS_PER_DOLLAR,
      adminEmails: normalizedEmails,
      aiConfig,
    });

    console.log(`Seeded platformSettings (isProd=${isProd})`);
    console.log('Pricing: gradingCostPerEssay=%s, creditsPerDollar=%s', SEED_GRADING_COST_PER_ESSAY, SEED_CREDITS_PER_DOLLAR);
    console.log('aiConfig:', JSON.stringify(aiConfig, null, 2));
    console.log('adminEmails:', normalizedEmails ?? []);

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
    adminEmails: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { isProd = false, adminEmails }) => {
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

    // Normalize admin emails to lowercase
    const normalizedEmails = adminEmails?.map(e => e.toLowerCase().trim());

    const id = await ctx.db.insert('platformSettings', {
      key: 'singleton',
      signupBonusAmount: SEED_SIGNUP_BONUS,
      gradingCostPerEssay: SEED_GRADING_COST_PER_ESSAY,
      creditsPerDollar: SEED_CREDITS_PER_DOLLAR,
      adminEmails: normalizedEmails,
      aiConfig,
    });

    console.log(`Reset platformSettings (isProd=${isProd})`);
    console.log('Pricing: gradingCostPerEssay=%s, creditsPerDollar=%s', SEED_GRADING_COST_PER_ESSAY, SEED_CREDITS_PER_DOLLAR);
    console.log('aiConfig:', JSON.stringify(aiConfig, null, 2));
    console.log('adminEmails:', normalizedEmails ?? []);

    return { status: 'reset', id };
  },
});

/**
 * Update only the AI config portion of platform settings
 * Preserves other settings like signupBonusAmount and pricing
 * Throws if platformSettings not seeded
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

    if (!existing) {
      throw new Error('platformSettings not found. Run seed first.');
    }

    const aiConfig = isProd ? PROD_AI_CONFIG : DEFAULT_AI_CONFIG;

    // Validate config before updating
    const validation = validateAiConfig(aiConfig);
    if (!validation.valid) {
      throw new Error(`Invalid AI config: ${validation.errors.join('; ')}`);
    }
    for (const warning of validation.warnings) {
      console.warn(`[updateAiConfigOnly] ${warning}`);
    }

    await ctx.db.patch(existing._id, { aiConfig });
    console.log(`Updated aiConfig (isProd=${isProd})`);
    console.log('aiConfig:', JSON.stringify(aiConfig, null, 2));
    return { status: 'updated', id: existing._id };
  },
});

/**
 * Set admin emails on existing platform settings
 * Preserves all other settings
 *
 * Usage: npx convex run seed/platformSettings:setAdminEmails '{"emails": ["admin@example.com"]}'
 */
export const setAdminEmails = internalMutation({
  args: {
    emails: v.array(v.string()),
  },
  handler: async (ctx, { emails }) => {
    const existing = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (!existing) {
      throw new Error('platformSettings not found. Run seed first.');
    }

    // Normalize emails to lowercase
    const normalizedEmails = emails.map(e => e.toLowerCase().trim());

    await ctx.db.patch(existing._id, {
      adminEmails: normalizedEmails,
    });

    console.log('Set admin emails:', normalizedEmails);
    return { status: 'updated', adminEmails: normalizedEmails };
  },
});

/**
 * Set pricing on existing platform settings
 * Preserves all other settings
 *
 * Usage: npx convex run seed/platformSettings:setPricing '{"gradingCostPerEssay": "1.00", "creditsPerDollar": "1.00"}'
 */
export const setPricing = internalMutation({
  args: {
    gradingCostPerEssay: v.string(),
    creditsPerDollar: v.string(),
  },
  handler: async (ctx, { gradingCostPerEssay, creditsPerDollar }) => {
    const existing = await ctx.db
      .query('platformSettings')
      .withIndex('by_key', q => q.eq('key', 'singleton'))
      .unique();

    if (!existing) {
      throw new Error('platformSettings not found. Run seed first.');
    }

    // Validate values using shared validation (prevents division by zero, NaN, negative)
    validatePricing(gradingCostPerEssay, creditsPerDollar);

    await ctx.db.patch(existing._id, {
      gradingCostPerEssay,
      creditsPerDollar,
    });

    const pricePerEssayUsd = calculatePricePerEssay(gradingCostPerEssay, creditsPerDollar);
    console.log('Set pricing:');
    console.log('  gradingCostPerEssay:', gradingCostPerEssay);
    console.log('  creditsPerDollar:', creditsPerDollar);
    console.log('  pricePerEssayUsd: $%s', pricePerEssayUsd);
    return { status: 'updated', gradingCostPerEssay, creditsPerDollar, pricePerEssayUsd };
  },
});
