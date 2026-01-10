import { describe, expect, it, vi } from 'vitest';

import {
  clampPercentage,
  classifyError,
  detectOutliers,
  retryWithBackoff,
} from './utils';

describe('grading utilities', () => {
  describe('clampPercentage', () => {
    it('clamps values to 0-100 range', () => {
      expect(clampPercentage(50)).toBe(50);
      expect(clampPercentage(0)).toBe(0);
      expect(clampPercentage(100)).toBe(100);
      expect(clampPercentage(-10)).toBe(0);
      expect(clampPercentage(150)).toBe(100);
    });
  });

  describe('classifyError', () => {
    it('identifies transient errors as retryable', () => {
      const transientMessages = [
        'Request timeout',
        'ECONNRESET',
        'rate limit exceeded',
        'HTTP 503',
      ];
      for (const message of transientMessages) {
        expect(classifyError(new Error(message)).isTransient).toBe(true);
      }
    });

    it('identifies permanent errors as non-retryable', () => {
      const permanentMessages = [
        'HTTP 400 Bad Request',
        'HTTP 401',
        'invalid request',
      ];
      for (const message of permanentMessages) {
        expect(classifyError(new Error(message)).isTransient).toBe(false);
      }
    });

    it('treats unknown errors as permanent', () => {
      expect(classifyError(new Error('something unexpected')).isTransient).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    const shortDelays = [10, 20, 30];

    it('succeeds without retry on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn, 3, shortDelays);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries transient errors until success', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(fn, 3, shortDelays);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws immediately on permanent error without retry', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('invalid request'));

      await expect(retryWithBackoff(fn, 3, shortDelays)).rejects.toThrow('invalid request');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws after exhausting all retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('timeout'));

      await expect(retryWithBackoff(fn, 2, [10, 20])).rejects.toThrow('timeout');
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });

  describe('detectOutliers', () => {
    function makeScores(percentages: number[]): Array<{ model: string; percentage: number }> {
      return percentages.map((p, i) => ({ model: `model-${i}`, percentage: p }));
    }

    function getIncludedCount(result: Array<{ included: boolean }>): number {
      return result.filter(s => s.included).length;
    }

    it('returns empty array for empty input', () => {
      expect(detectOutliers([])).toEqual([]);
    });

    it('includes single score', () => {
      const result = detectOutliers(makeScores([75]));

      expect(result).toHaveLength(1);
      expect(result[0]?.included).toBe(true);
    });

    it('includes all when mean is zero', () => {
      const result = detectOutliers(makeScores([0, 0]));

      expect(getIncludedCount(result)).toBe(2);
    });

    it('excludes outlier exceeding deviation threshold', () => {
      // Scores: [50, 55, 100], mean ~68, score 100 deviates ~46%
      const result = detectOutliers(makeScores([50, 55, 100]), 10);

      expect(getIncludedCount(result)).toBe(2);
      expect(result[2]?.included).toBe(false);
    });

    it('includes all scores within threshold', () => {
      // Scores: [48, 50, 52], mean = 50, max deviation = 4%
      const result = detectOutliers(makeScores([48, 50, 52]), 10);

      expect(getIncludedCount(result)).toBe(3);
    });

    it('excludes at most one score per detection', () => {
      const result = detectOutliers(makeScores([30, 70, 100]), 5);

      expect(result.filter(s => !s.included)).toHaveLength(1);
    });

    it('handles realistic 5-model grading scenario', () => {
      // Four consistent scores (75-78) and one outlier (95)
      const result = detectOutliers(makeScores([75, 78, 76, 77, 95]), 10);

      expect(getIncludedCount(result)).toBe(4);
      expect(result[4]?.included).toBe(false);
    });
  });
});
