// Model Catalog Queries and Mutations
// Manages available AI models from OpenRouter
// View pricing: https://openrouter.ai/models

import { v } from 'convex/values';

import { internalMutation, internalQuery, query } from './_generated/server';
import { modelCapabilityValidator } from './schema';

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
 * Internal only - includes disabled models
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

// =============================================================================
// Internal Mutations (for seeding)
// =============================================================================

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
