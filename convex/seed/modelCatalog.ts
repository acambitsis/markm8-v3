// Model Catalog Seeding Script
// Initialize model catalog with curated list of grading-quality models
//
// Usage:
//   Dev:  npx convex run seed/modelCatalog:seed
//   Prod: npx convex run seed/modelCatalog:seed --prod
//   Reset: npx convex run seed/modelCatalog:reset

/* eslint-disable no-console -- Seed scripts use console for Convex logs */

import { internalMutation } from '../_generated/server';
import type { ModelCapability, ReasoningEffort } from '../schema';

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
  // Reasoning support
  supportsReasoning?: boolean;
  reasoningRequired?: boolean;
  defaultReasoningEffort?: ReasoningEffort;
};

const INITIAL_MODELS: SeedModel[] = [
  // xAI - Grok 4 has built-in reasoning (can't configure), Grok 4.1 Fast is optional
  { slug: 'x-ai/grok-4', name: 'Grok 4', provider: 'xAI', capabilities: ['grading'] },
  { slug: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI', capabilities: ['grading', 'title'], supportsReasoning: true, reasoningRequired: false, defaultReasoningEffort: 'medium' },

  // OpenAI - GPT-5.2-pro requires reasoning, GPT-5.2 supports optional reasoning
  { slug: 'openai/gpt-5.2', name: 'GPT 5.2', provider: 'OpenAI', capabilities: ['grading'], supportsReasoning: true, reasoningRequired: false, defaultReasoningEffort: 'medium' },
  { slug: 'openai/gpt-5.2-pro', name: 'GPT 5.2 Pro', provider: 'OpenAI', capabilities: ['grading'], supportsReasoning: true, reasoningRequired: true, defaultReasoningEffort: 'medium' },

  // Anthropic - Claude models support optional reasoning
  { slug: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', provider: 'Anthropic', capabilities: ['grading'], supportsReasoning: true, reasoningRequired: false, defaultReasoningEffort: 'medium' },
  { slug: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', provider: 'Anthropic', capabilities: ['grading', 'title'], supportsReasoning: true, reasoningRequired: false, defaultReasoningEffort: 'medium' },

  // Google - Gemini 3 Pro requires reasoning, Flash is optional
  { slug: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', provider: 'Google', capabilities: ['grading', 'title'], supportsReasoning: true, reasoningRequired: false, defaultReasoningEffort: 'medium' },
  { slug: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'Google', capabilities: ['grading'], supportsReasoning: true, reasoningRequired: true, defaultReasoningEffort: 'high' },
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
        supportsReasoning: model.supportsReasoning,
        reasoningRequired: model.reasoningRequired,
        defaultReasoningEffort: model.defaultReasoningEffort,
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
    const existing = await ctx.db.query('modelCatalog').take(100); // Defensive bound
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
        supportsReasoning: model.supportsReasoning,
        reasoningRequired: model.reasoningRequired,
        defaultReasoningEffort: model.defaultReasoningEffort,
      });
      created++;
    }

    console.log(`Reset complete: ${created} models created`);
    return { deleted: existing.length, created };
  },
});
