// Model Catalog Queries and Mutations
// Manages available AI models from OpenRouter

import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalAction, internalMutation, internalQuery, query } from './_generated/server';
import type { ModelCapability } from './schema';
import { modelCapabilityValidator, reasoningEffortValidator } from './schema';

// =============================================================================
// Public Queries (for UI)
// =============================================================================

/**
 * Get all enabled models, optionally filtered by capability
 * Used by UI to populate model selection dropdowns
 * Public query - only exposes enabled models (non-sensitive)
 */
export const getEnabled = query({
  args: {
    capability: v.optional(modelCapabilityValidator),
  },
  handler: async (ctx, { capability }) => {
    let models = await ctx.db
      .query('modelCatalog')
      .withIndex('by_enabled', q => q.eq('enabled', true))
      .take(100); // Defensive bound

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
 * Internal only - includes disabled models and pricing info
 */
export const getAll = internalQuery({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query('modelCatalog').take(100); // Defensive bound

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
      .take(100); // Defensive bound

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
    // Reasoning support
    supportsReasoning: v.optional(v.boolean()),
    reasoningRequired: v.optional(v.boolean()),
    defaultReasoningEffort: v.optional(reasoningEffortValidator),
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
        supportsReasoning: args.supportsReasoning,
        reasoningRequired: args.reasoningRequired,
        defaultReasoningEffort: args.defaultReasoningEffort,
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
        supportsReasoning: args.supportsReasoning,
        reasoningRequired: args.reasoningRequired,
        defaultReasoningEffort: args.defaultReasoningEffort,
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
    const models = await ctx.db.query('modelCatalog').take(100); // Defensive bound
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
  'x-ai/grok-4.1-fast',
  'google/gemini-3-flash-preview',
  'openai/gpt-5.2-pro',
  'google/gemini-3-pro-preview',
  'anthropic/claude-opus-4.5',
  'anthropic/claude-haiku-4.5',
];

/**
 * Safely parse pricing string to number, returning undefined if invalid
 */
function parsePricing(value: string | undefined | null): number | undefined {
  if (value == null) {
    return undefined;
  }
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed * 1_000_000; // Convert per-token to per-1M tokens
}

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

    const errors: Array<{ slug: string; error: string }> = [];

    for (const model of trackedModels) {
      try {
        // Check if model already exists
        const existing = await ctx.runQuery(internal.modelCatalog.getBySlug, {
          slug: model.id,
        });

        // Safely parse pricing (returns undefined if invalid)
        const pricingInputPer1M = parsePricing(model.pricing?.prompt);
        const pricingOutputPer1M = parsePricing(model.pricing?.completion);

        // Determine capabilities (all tracked models support grading)
        const capabilities: ModelCapability[] = ['grading'];
        // Smaller/cheaper models also good for title generation
        const isSmallModel
          = model.id.includes('mini')
          || model.id.includes('flash')
          || model.id.includes('haiku')
          || (pricingInputPer1M != null && pricingInputPer1M < 1);
        if (isSmallModel) {
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
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ slug: model.id, error: message });
        console.error(`Failed to sync model ${model.id}:`, message);
      }
    }

    return {
      synced: results.length,
      failed: errors.length,
      results,
      errors,
    };
  },
});
