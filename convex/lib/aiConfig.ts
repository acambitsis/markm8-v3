// AI Configuration Defaults and Validation
// Centralized configuration for all AI-related features

import type {
  AiConfig,
  GradingConfig,
  TitleGenerationConfig,
} from '../schema';

// =============================================================================
// Default Configuration
// =============================================================================

export const DEFAULT_GRADING_CONFIG: GradingConfig = {
  mode: 'mock', // Override to 'live' for production via seed script
  temperature: 0.4, // Lower temperature for consistent grading (0.3-0.5 recommended)
  runs: [
    { model: 'x-ai/grok-4.1' },
    { model: 'x-ai/grok-4.1' },
    { model: 'x-ai/grok-4.1' },
  ],
  outlierThresholdPercent: 10,
  retry: {
    maxRetries: 3,
    backoffMs: [5000, 15000, 45000],
  },
};

export const DEFAULT_TITLE_GENERATION_CONFIG: TitleGenerationConfig = {
  model: 'openai/gpt-4o-mini',
  temperature: 0.4,
  maxTokens: 14, // ~10 words
};

export const DEFAULT_AI_CONFIG: AiConfig = {
  grading: DEFAULT_GRADING_CONFIG,
  titleGeneration: DEFAULT_TITLE_GENERATION_CONFIG,
};

// =============================================================================
// Validation
// =============================================================================

export type ValidationResult = {
  valid: boolean;
  warnings: string[];
  errors: string[];
};

/**
 * Validate grading configuration
 * Returns errors for critical issues, warnings for suboptimal values
 */
export function validateGradingConfig(config: GradingConfig): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Temperature validation (hard: 0-1, soft: 0.3-0.5 for grading)
  if (config.temperature < 0 || config.temperature > 1) {
    errors.push(`Temperature ${config.temperature} out of range [0, 1]`);
  } else if (config.temperature > 0.5) {
    warnings.push(
      `Temperature ${config.temperature} is high for consistent grading; recommend 0.3-0.5`,
    );
  }

  // Model count validation (hard: 1-10, soft: 3-5 for consensus)
  if (config.runs.length < 1) {
    errors.push('At least 1 grading run required');
  } else if (config.runs.length > 10) {
    errors.push(`Maximum 10 grading runs allowed, got ${config.runs.length}`);
  } else if (config.runs.length < 3) {
    warnings.push(
      `Only ${config.runs.length} grading run(s) configured; 3+ recommended for consensus accuracy`,
    );
  } else if (config.runs.length > 5) {
    warnings.push(
      `${config.runs.length} grading runs configured; 3-5 is typical (cost vs accuracy tradeoff)`,
    );
  }

  // Model ID format validation (basic sanity check)
  for (const run of config.runs) {
    if (!run.model.includes('/')) {
      warnings.push(
        `Model "${run.model}" doesn't match expected format "provider/model"`,
      );
    }
  }

  // Outlier threshold validation
  if (
    config.outlierThresholdPercent < 0
    || config.outlierThresholdPercent > 100
  ) {
    errors.push(
      `Outlier threshold ${config.outlierThresholdPercent}% out of range [0, 100]`,
    );
  }

  // Retry config validation
  if (config.retry.maxRetries < 0) {
    errors.push(`maxRetries cannot be negative: ${config.retry.maxRetries}`);
  }
  if (config.retry.backoffMs.length === 0 && config.retry.maxRetries > 0) {
    warnings.push('backoffMs array is empty but maxRetries > 0');
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validate title generation configuration
 */
export function validateTitleGenerationConfig(
  config: TitleGenerationConfig,
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Temperature validation
  if (config.temperature < 0 || config.temperature > 1) {
    errors.push(`Temperature ${config.temperature} out of range [0, 1]`);
  }

  // Model ID format validation
  if (!config.model.includes('/')) {
    warnings.push(
      `Model "${config.model}" doesn't match expected format "provider/model"`,
    );
  }

  // Max tokens validation
  if (config.maxTokens < 1) {
    errors.push(`maxTokens must be positive: ${config.maxTokens}`);
  } else if (config.maxTokens > 100) {
    warnings.push(
      `maxTokens ${config.maxTokens} seems high for title generation; typically 10-20`,
    );
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Validate complete AI configuration
 * Aggregates validation results from all sub-configs
 */
export function validateAiConfig(config: AiConfig): ValidationResult {
  const gradingResult = validateGradingConfig(config.grading);
  const titleResult = validateTitleGenerationConfig(config.titleGeneration);

  return {
    valid: gradingResult.valid && titleResult.valid,
    warnings: [
      ...gradingResult.warnings.map(w => `[grading] ${w}`),
      ...titleResult.warnings.map(w => `[titleGeneration] ${w}`),
    ],
    errors: [
      ...gradingResult.errors.map(e => `[grading] ${e}`),
      ...titleResult.errors.map(e => `[titleGeneration] ${e}`),
    ],
  };
}

// =============================================================================
// Catalog Validation (requires database context)
// =============================================================================

/**
 * Options for catalog validation
 */
export type CatalogValidationOptions = {
  /** Enabled model slugs for grading capability */
  gradingSlugs: string[];
  /** Enabled model slugs for title capability */
  titleSlugs: string[];
  /** If true, validation fails for missing models; if false, only warns */
  strict?: boolean;
};

/**
 * Validate AI config models against the model catalog
 * Call this after fetching enabled slugs from the database
 *
 * @example
 * const gradingSlugs = await ctx.runQuery(internal.modelCatalog.getEnabledSlugs, { capability: 'grading' });
 * const titleSlugs = await ctx.runQuery(internal.modelCatalog.getEnabledSlugs, { capability: 'title' });
 * const result = validateAiConfigAgainstCatalog(config, { gradingSlugs, titleSlugs, strict: true });
 */
export function validateAiConfigAgainstCatalog(
  config: AiConfig,
  options: CatalogValidationOptions,
): ValidationResult {
  const { gradingSlugs, titleSlugs, strict = false } = options;
  const warnings: string[] = [];
  const errors: string[] = [];

  const gradingSet = new Set(gradingSlugs);
  const titleSet = new Set(titleSlugs);

  // Check grading models
  for (const run of config.grading.runs) {
    if (!gradingSet.has(run.model)) {
      const msg = `Grading model "${run.model}" not in catalog or not enabled for grading`;
      if (strict) {
        errors.push(msg);
      } else {
        warnings.push(msg);
      }
    }
  }

  // Check title generation model
  if (!titleSet.has(config.titleGeneration.model)) {
    const msg = `Title model "${config.titleGeneration.model}" not in catalog or not enabled for title generation`;
    if (strict) {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
