// Model Catalog Seeding Script
// Initialize model catalog with curated list of grading-quality models
//
// Usage:
//   Dev:  npx convex run seed/modelCatalog:seed
//   Prod: npx convex run seed/modelCatalog:seed --prod
//   Reset: npx convex run seed/modelCatalog:reset

/* eslint-disable no-console -- Seed scripts use console for Convex logs */

import { internalMutation } from '../_generated/server';
import type { ModelCapability } from '../schema';

// =============================================================================
// Initial Model Catalog
// Curated list of models suitable for essay grading
// =============================================================================

type SeedModel = {
  slug: string;
  name: string;
  provider: string;
  capabilities: ModelCapability[];
  contextLength?: number;
  pricingInputPer1M?: number;
  pricingOutputPer1M?: number;
};

const INITIAL_MODELS: SeedModel[] = [
  // xAI - Grok models (excellent for reasoning)
  {
    slug: 'x-ai/grok-4.1',
    name: 'Grok 4.1',
    provider: 'xAI',
    capabilities: ['grading'],
    contextLength: 131072,
    pricingInputPer1M: 3.0,
    pricingOutputPer1M: 15.0,
  },
  {
    slug: 'x-ai/grok-3',
    name: 'Grok 3',
    provider: 'xAI',
    capabilities: ['grading'],
    contextLength: 131072,
    pricingInputPer1M: 3.0,
    pricingOutputPer1M: 15.0,
  },

  // OpenAI - GPT-4 family
  {
    slug: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    capabilities: ['grading'],
    contextLength: 128000,
    pricingInputPer1M: 2.5,
    pricingOutputPer1M: 10.0,
  },
  {
    slug: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    capabilities: ['grading', 'title'],
    contextLength: 128000,
    pricingInputPer1M: 0.15,
    pricingOutputPer1M: 0.6,
  },
  {
    slug: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    capabilities: ['grading'],
    contextLength: 128000,
    pricingInputPer1M: 10.0,
    pricingOutputPer1M: 30.0,
  },

  // Anthropic - Claude family
  {
    slug: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    capabilities: ['grading'],
    contextLength: 200000,
    pricingInputPer1M: 3.0,
    pricingOutputPer1M: 15.0,
  },
  {
    slug: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    capabilities: ['grading'],
    contextLength: 200000,
    pricingInputPer1M: 3.0,
    pricingOutputPer1M: 15.0,
  },
  {
    slug: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    capabilities: ['grading'],
    contextLength: 200000,
    pricingInputPer1M: 15.0,
    pricingOutputPer1M: 75.0,
  },

  // Google - Gemini family
  {
    slug: 'google/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    capabilities: ['grading', 'title'],
    contextLength: 1000000,
    pricingInputPer1M: 0.1,
    pricingOutputPer1M: 0.4,
  },
  {
    slug: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: 'Google',
    capabilities: ['grading'],
    contextLength: 2000000,
    pricingInputPer1M: 1.25,
    pricingOutputPer1M: 5.0,
  },

  // DeepSeek - Cost-effective option
  {
    slug: 'deepseek/deepseek-chat-v3',
    name: 'DeepSeek Chat V3',
    provider: 'DeepSeek',
    capabilities: ['grading', 'title'],
    contextLength: 64000,
    pricingInputPer1M: 0.27,
    pricingOutputPer1M: 1.1,
  },

  // Meta - Llama models
  {
    slug: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    capabilities: ['grading'],
    contextLength: 131072,
    pricingInputPer1M: 0.4,
    pricingOutputPer1M: 0.4,
  },
];

// =============================================================================
// Seed Functions
// =============================================================================

/**
 * Seed model catalog with initial models
 * Only adds models that don't already exist
 */
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const stats = { created: 0, skipped: 0 };

    for (const model of INITIAL_MODELS) {
      // Check if model already exists
      const existing = await ctx.db
        .query('modelCatalog')
        .withIndex('by_slug', q => q.eq('slug', model.slug))
        .unique();

      if (existing) {
        console.log(`Skipping existing model: ${model.slug}`);
        stats.skipped++;
        continue;
      }

      // Insert new model (enabled by default)
      await ctx.db.insert('modelCatalog', {
        slug: model.slug,
        name: model.name,
        provider: model.provider,
        enabled: true,
        capabilities: model.capabilities,
        contextLength: model.contextLength,
        pricingInputPer1M: model.pricingInputPer1M,
        pricingOutputPer1M: model.pricingOutputPer1M,
        lastSyncedAt: Date.now(),
      });

      console.log(`Created model: ${model.slug}`);
      stats.created++;
    }

    console.log(`Seed complete: ${stats.created} created, ${stats.skipped} skipped`);
    return stats;
  },
});

/**
 * Reset model catalog and re-seed
 * Deletes all existing models and re-creates from initial list
 */
export const reset = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing models
    const existing = await ctx.db.query('modelCatalog').collect();
    for (const model of existing) {
      await ctx.db.delete(model._id);
    }
    console.log(`Deleted ${existing.length} existing models`);

    // Re-seed
    let created = 0;
    for (const model of INITIAL_MODELS) {
      await ctx.db.insert('modelCatalog', {
        slug: model.slug,
        name: model.name,
        provider: model.provider,
        enabled: true,
        capabilities: model.capabilities,
        contextLength: model.contextLength,
        pricingInputPer1M: model.pricingInputPer1M,
        pricingOutputPer1M: model.pricingOutputPer1M,
        lastSyncedAt: Date.now(),
      });
      created++;
    }

    console.log(`Reset complete: ${created} models created`);
    return { deleted: existing.length, created };
  },
});
