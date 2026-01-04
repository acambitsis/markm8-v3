// Model Catalog Queries and Mutations
// Manages available AI models from OpenRouter

import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalAction, internalMutation, internalQuery, query } from './_generated/server';
import type { ModelCapability } from './schema';
import { modelCapabilityValidator } from './schema';

// =============================================================================
// Public Queries (for UI)
// =============================================================================

/**
 * Get all enabled models, optionally filtered by capability
 * Used by UI to populate model selection dropdowns
 */
export const getEnabled = query({
  args: {
    capability: v.optional(modelCapabilityValidator),
  },
  handler: async (ctx, { capability }) => {
    let models = await ctx.db
      .query('modelCatalog')
      .withIndex('by_enabled', q => q.eq('enabled', true))
      .collect();

    // Filter by capability if specified
    if (capability) {
      models = models.filter(m => m.capabilities.includes(capability));
    }

    // Sort by provider then name for consistent ordering
    return models.sort((a, b) => {
      const providerCompare = a.provider.localeCompare(b.provider);
      if (providerCompare !== 0) {
        return providerCompare;
      }
      return a.name.localeCompare(b.name);
    });
  },
});

/**
 * Get all models (enabled and disabled) for admin UI
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query('modelCatalog').collect();

    // Sort by provider then name
    return models.sort((a, b) => {
      const providerCompare = a.provider.localeCompare(b.provider);
      if (providerCompare !== 0) {
        return providerCompare;
      }
      return a.name.localeCompare(b.name);
    });
  },
});

// =============================================================================
// Internal Queries
// =============================================================================

/**
 * Get enabled model slugs for validation
 * Returns a set-like array for efficient lookup
 */
export const getEnabledSlugs = internalQuery({
  args: {
    capability: v.optional(modelCapabilityValidator),
  },
  handler: async (ctx, { capability }): Promise<string[]> => {
    let models = await ctx.db
      .query('modelCatalog')
      .withIndex('by_enabled', q => q.eq('enabled', true))
      .collect();

    if (capability) {
      models = models.filter(m => m.capabilities.includes(capability));
    }

    return models.map(m => m.slug);
  },
});

/**
 * Get a model by slug (internal use)
 */
export const getBySlug = internalQuery({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query('modelCatalog')
      .withIndex('by_slug', q => q.eq('slug', slug))
      .unique();
  },
});

// =============================================================================
// Internal Mutations (for seeding and syncing)
// =============================================================================

/**
 * Upsert a model in the catalog
 * Creates if not exists, updates if exists
 */
export const upsert = internalMutation({
  args: {
    slug: v.string(),
    name: v.string(),
    provider: v.string(),
    enabled: v.boolean(),
    capabilities: v.array(modelCapabilityValidator),
    contextLength: v.optional(v.number()),
    pricingInputPer1M: v.optional(v.number()),
    pricingOutputPer1M: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('modelCatalog')
      .withIndex('by_slug', q => q.eq('slug', args.slug))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        provider: args.provider,
        enabled: args.enabled,
        capabilities: args.capabilities,
        contextLength: args.contextLength,
        pricingInputPer1M: args.pricingInputPer1M,
        pricingOutputPer1M: args.pricingOutputPer1M,
        lastSyncedAt: now,
      });
      return { status: 'updated' as const, id: existing._id };
    } else {
      const id = await ctx.db.insert('modelCatalog', {
        slug: args.slug,
        name: args.name,
        provider: args.provider,
        enabled: args.enabled,
        capabilities: args.capabilities,
        contextLength: args.contextLength,
        pricingInputPer1M: args.pricingInputPer1M,
        pricingOutputPer1M: args.pricingOutputPer1M,
        lastSyncedAt: now,
      });
      return { status: 'created' as const, id };
    }
  },
});

/**
 * Toggle a model's enabled status
 */
export const setEnabled = internalMutation({
  args: {
    slug: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, { slug, enabled }) => {
    const model = await ctx.db
      .query('modelCatalog')
      .withIndex('by_slug', q => q.eq('slug', slug))
      .unique();

    if (!model) {
      throw new Error(`Model not found: ${slug}`);
    }

    await ctx.db.patch(model._id, { enabled });
    return { status: 'updated', slug, enabled };
  },
});

/**
 * Update a model's capabilities
 */
export const setCapabilities = internalMutation({
  args: {
    slug: v.string(),
    capabilities: v.array(modelCapabilityValidator),
  },
  handler: async (ctx, { slug, capabilities }) => {
    const model = await ctx.db
      .query('modelCatalog')
      .withIndex('by_slug', q => q.eq('slug', slug))
      .unique();

    if (!model) {
      throw new Error(`Model not found: ${slug}`);
    }

    await ctx.db.patch(model._id, { capabilities });
    return { status: 'updated', slug, capabilities };
  },
});

/**
 * Delete a model from the catalog
 */
export const remove = internalMutation({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, { slug }) => {
    const model = await ctx.db
      .query('modelCatalog')
      .withIndex('by_slug', q => q.eq('slug', slug))
      .unique();

    if (!model) {
      return { status: 'not_found', slug };
    }

    await ctx.db.delete(model._id);
    return { status: 'deleted', slug };
  },
});

/**
 * Clear all models from the catalog (for reset)
 */
export const clear = internalMutation({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query('modelCatalog').collect();
    for (const model of models) {
      await ctx.db.delete(model._id);
    }
    return { status: 'cleared', count: models.length };
  },
});

// =============================================================================
// OpenRouter Sync Action
// =============================================================================

// OpenRouter API response types
type OpenRouterModel = {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: string; // Cost per token as string
    completion: string;
  };
};

type OpenRouterResponse = {
  data: OpenRouterModel[];
};

// Provider extraction from model ID
function extractProvider(modelId: string): string {
  const [provider] = modelId.split('/');
  // Capitalize and format provider name
  const providerMap: Record<string, string> = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Google',
    'meta-llama': 'Meta',
    'x-ai': 'xAI',
    'mistralai': 'Mistral',
    'cohere': 'Cohere',
    'deepseek': 'DeepSeek',
  };
  return providerMap[provider ?? ''] ?? provider ?? 'Unknown';
}

// Models we want to track (curated list for grading quality)
const TRACKED_MODEL_PATTERNS = [
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/gpt-4-turbo',
  'openai/o1',
  'openai/o1-mini',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-opus',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-opus-4',
  'google/gemini-2.0-flash',
  'google/gemini-pro-1.5',
  'x-ai/grok-4.1',
  'x-ai/grok-3',
  'meta-llama/llama-3.3-70b',
  'deepseek/deepseek-chat-v3',
  'mistralai/mistral-large',
];

/**
 * Sync model catalog from OpenRouter API
 * Fetches latest model info and updates pricing/context length
 * Only tracks curated models suitable for grading
 */
export const syncFromOpenRouter = internalAction({
  args: {
    enableNew: v.optional(v.boolean()), // Whether to enable newly discovered models
  },
  handler: async (ctx, { enableNew = false }) => {
    // Fetch from OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OpenRouterResponse;

    // Filter to tracked models
    const trackedModels = data.data.filter(model =>
      TRACKED_MODEL_PATTERNS.some(pattern => model.id.startsWith(pattern)),
    );

    const results: Array<{ slug: string; status: string }> = [];

    for (const model of trackedModels) {
      // Check if model already exists
      const existing = await ctx.runQuery(internal.modelCatalog.getBySlug, {
        slug: model.id,
      });

      // Convert pricing from per-token to per-1M tokens
      const pricingInputPer1M = Number.parseFloat(model.pricing.prompt) * 1_000_000;
      const pricingOutputPer1M = Number.parseFloat(model.pricing.completion) * 1_000_000;

      // Determine capabilities (all tracked models support grading)
      const capabilities: ModelCapability[] = ['grading'];
      // Smaller/cheaper models also good for title generation
      if (model.id.includes('mini') || model.id.includes('flash') || pricingInputPer1M < 1) {
        capabilities.push('title');
      }

      const result = await ctx.runMutation(internal.modelCatalog.upsert, {
        slug: model.id,
        name: model.name,
        provider: extractProvider(model.id),
        enabled: existing ? existing.enabled : enableNew,
        capabilities,
        contextLength: model.context_length,
        pricingInputPer1M,
        pricingOutputPer1M,
      });

      results.push({ slug: model.id, status: result.status });
    }

    return {
      synced: results.length,
      results,
    };
  },
});
