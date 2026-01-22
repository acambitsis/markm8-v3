// Grading Utility Functions
// Shared utilities for retry logic, outlier detection, and grade conversion

// User-facing error message (stable, never includes internal details)
export const USER_ERROR_MESSAGE = 'Grading failed. You were not charged. Please try again.';

export function clampPercentage(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/**
 * Classify error as transient (retry) or permanent (fail immediately)
 */
export function classifyError(error: unknown): {
  isTransient: boolean;
  message: string;
} {
  const message = error instanceof Error ? error.message : String(error);

  // Network/timeout errors - transient
  if (
    message.includes('timeout')
    || message.includes('ECONNRESET')
    || message.includes('ENOTFOUND')
    || message.includes('network')
  ) {
    return { isTransient: true, message };
  }

  // Rate limits - transient
  if (message.includes('rate limit') || message.includes('429')) {
    return { isTransient: true, message };
  }

  // Service unavailable - transient
  if (message.includes('503') || message.includes('service unavailable')) {
    return { isTransient: true, message };
  }

  // API errors (400, 401, 403) - permanent
  if (
    message.includes('400')
    || message.includes('401')
    || message.includes('403')
    || message.includes('invalid')
    || message.includes('unauthorized')
    || message.includes('forbidden')
  ) {
    return { isTransient: false, message };
  }

  // Default: treat as permanent to avoid infinite retries
  return { isTransient: false, message };
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param backoffMs - Backoff delays in milliseconds (default: [5000, 15000, 45000])
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  backoffMs = [5000, 15000, 45000],
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const { isTransient } = classifyError(error);

      // Don't retry permanent errors
      if (!isTransient) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt >= maxRetries) {
        throw error;
      }

      // Wait before retrying
      const delay = backoffMs[Math.min(attempt, backoffMs.length - 1)] ?? 5000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Detect outliers using "furthest from mean" algorithm. * We are currently not exlcuding any runs and are doing three.
 * This could change in future, but our philosophy of showing a range of grades fits well into including all runs.
 */
export function detectOutliers(
  scores: Array<{ model: string; percentage: number }>,
  thresholdPercent = 10,
): Array<{ model: string; percentage: number; included: boolean; reason?: string }> {
  // Helper to include all scores
  const includeAll = () => scores.map(score => ({ ...score, included: true }));

  if (scores.length === 0) {
    return [];
  }
  if (thresholdPercent >= 100) {
    return includeAll();
  } // Outlier detection disabled

  // Calculate mean
  const sum = scores.reduce((acc, s) => acc + s.percentage, 0);
  const mean = sum / scores.length;

  // Edge case: mean is 0 or near-zero - no outliers possible
  if (mean === 0 || Math.abs(mean) < 0.01) {
    return includeAll();
  }

  // Calculate deviations from mean
  const deviations = scores.map((score) => {
    const deviation = Math.abs(score.percentage - mean);
    const deviationPercent = (deviation / mean) * 100;
    return { ...score, deviation, deviationPercent };
  });

  // Find maximum deviation
  const maxDeviation = Math.max(...deviations.map(d => d.deviationPercent));

  // If max deviation exceeds threshold, exclude the furthest score
  if (maxDeviation > thresholdPercent) {
    const furthestIndex = deviations.findIndex(d => d.deviationPercent === maxDeviation);

    return scores.map((score, i) => ({
      model: score.model,
      percentage: score.percentage,
      included: i !== furthestIndex,
      reason: i === furthestIndex
        ? `Outlier detected: ${maxDeviation.toFixed(1)}% deviation from mean (${mean.toFixed(1)}%)`
        : undefined,
    }));
  }

  return includeAll();
}
