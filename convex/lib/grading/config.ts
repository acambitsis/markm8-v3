// Grading Ensemble Configuration
// Handles configuration retrieval and types for the grading system

export const GRADING_COST = '1.00';

export type GradingEnsembleMode = 'mock' | 'live';

/**
 * Grading ensemble configuration.
 *
 * Priority order (highest to lowest):
 * 1. Environment variables (MARKM8_GRADING_*) - for emergency/testing overrides
 * 2. Testing config (if testing.enabled === true) - from platformSettings.aiConfig.testing.grading
 * 3. Production config - from platformSettings.aiConfig.grading
 * 4. Hardcoded defaults - fallback if config missing
 *
 * Supports both `mock` (for testing) and `live` (real AI grading) modes.
 * The implementation supports:
 * - 3, 4, or 5 parallel grading runs
 * - Single model for all runs, or per-run models (mixed models)
 * - Outlier detection (excludes scores >10% deviation from mean)
 * - Retry logic with exponential backoff (3 retries: 5s, 15s, 45s)
 * - Error classification (transient vs permanent)
 *
 * Env vars (Convex action runtime) - HIGHEST PRIORITY:
 * - `MARKM8_GRADING_MODE`: 'mock' | 'live' (default 'mock')
 * - `MARKM8_GRADING_MODELS`: comma-separated list of models for each run
 *    - Example: "x-ai/grok-4.1,x-ai/grok-4.1,google/gemini-3"
 * - `MARKM8_GRADING_RUNS`: number of runs if MODELS not provided (default 3)
 *
 * Note: Reading from platformSettings.aiConfig is planned for future enhancement.
 */
export function getGradingEnsembleConfig(): {
  mode: GradingEnsembleMode;
  runModels: string[];
} {
  // Priority 1: Environment variables (highest priority, for emergency/testing)
  const rawMode = (process.env.MARKM8_GRADING_MODE ?? 'mock').toLowerCase();
  const mode: GradingEnsembleMode = rawMode === 'live' ? 'live' : 'mock';

  const modelsFromEnv = (process.env.MARKM8_GRADING_MODELS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const runsFromEnv = Number.parseInt(process.env.MARKM8_GRADING_RUNS ?? '', 10);
  const runs = Number.isFinite(runsFromEnv) ? runsFromEnv : 3;

  const desiredRuns = Math.min(5, Math.max(3, runs));

  // If env vars provided, use them (highest priority)
  if (modelsFromEnv.length >= 1) {
    // Clamp to 3..5 by truncating or padding with the first model.
    const clamped = modelsFromEnv.slice(0, 5);
    while (clamped.length < 3) {
      clamped.push(clamped[0]!);
    }
    return { mode, runModels: clamped };
  }

  // Priority 2 & 3: TODO - Read from platformSettings.aiConfig
  // const aiConfig = await ctx.runQuery(internal.platformSettings.getAiConfig, {});
  // if (aiConfig?.testing?.enabled && aiConfig.testing.grading) {
  //   // Use testing config (allows fast variants)
  //   return { mode, runModels: aiConfig.testing.grading.runs.map(r => r.model) };
  // }
  // if (aiConfig?.grading) {
  //   // Use production config (full models only)
  //   return { mode, runModels: aiConfig.grading.runs.map(r => r.model) };
  // }

  // Priority 4: Hardcoded defaults (fallback)
  // Default: 3 runs, all x-ai/grok-4.1 (matches previous behavior, but configurable).
  return { mode, runModels: Array.from({ length: desiredRuns }, () => 'x-ai/grok-4.1') };
}
