// Platform settings queries and mutations
// Handles admin-configurable platform values

import type { DatabaseReader } from './_generated/server';
import { internalMutation, internalQuery } from './_generated/server';
import {
  type CatalogValidationOptions,
  validateAiConfig,
  validateAiConfigAgainstCatalog,
} from './lib/aiConfig';
import { type AiConfig, aiConfigValidator, type ModelCapability } from './schema';

export const DEFAULT_SIGNUP_BONUS = '1.00';

/**
 * Helper to fetch enabled model slugs by capability
 * Extracts common catalog query logic used in validation
 */
async function getEnabledSlugsByCapability(
  db: DatabaseReader,
  capability: ModelCapability,
): Promise<string[]> {
  const models = await db
    .query('modelCatalog')
    .withIndex('by_enabled', q => q.eq('enabled', true))
    .take(100); // Defensive bound

  return models
    .filter(m => m.capabilities.includes(capability))
    .map(m => m.slug);
}

/**
 * Helper to get catalog validation options from database
 */
async function getCatalogValidationOptions(
  db: DatabaseReader,
): Promise<CatalogValidationOptions | null> {
  const gradingSlugs = await getEnabledSlugsByCapability(db, 'grading');
  const titleSlugs = await getEnabledSlugsByCapability(db, 'title');

  // Return null if catalog not seeded
  if (gradingSlugs.length === 0 && titleSlugs.length === 0) {
    return null;
  }

  return { gradingSlugs, titleSlugs, strict: false };
}

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

    // Schema validation (structure, ranges, etc.)
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

    // Catalog validation (check models exist and are enabled)
    // This is a soft check - warns but doesn't fail
    const catalogOptions = await getCatalogValidationOptions(ctx.db);
    if (catalogOptions) {
      const catalogValidation = validateAiConfigAgainstCatalog(config, catalogOptions);
      for (const warning of catalogValidation.warnings) {
        console.warn(`[aiConfig] ${warning}`);
      }
    }

    return config;
  },
});

/**
 * Update AI model configuration (admin only)
 * Validates config before saving; throws on invalid configuration
 * Optionally validates against model catalog if strict mode enabled
 */
export const updateAiConfig = internalMutation({
  args: {
    aiConfig: aiConfigValidator,
  },
  handler: async (ctx, { aiConfig }) => {
    const allWarnings: string[] = [];

    // Schema validation (structure, ranges, etc.)
    const validation = validateAiConfig(aiConfig);
    if (!validation.valid) {
      const errorMsg = validation.errors.join('; ');
      throw new Error(`Invalid AI configuration: ${errorMsg}`);
    }
    allWarnings.push(...validation.warnings);

    // Catalog validation (check models exist and are enabled)
    const catalogOptions = await getCatalogValidationOptions(ctx.db);
    if (catalogOptions) {
      const catalogValidation = validateAiConfigAgainstCatalog(aiConfig, catalogOptions);
      allWarnings.push(...catalogValidation.warnings);
    }

    // Log all warnings
    for (const warning of allWarnings) {
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

    return { success: true, warnings: allWarnings };
  },
});
