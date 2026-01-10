import { describe, expect, it } from 'vitest';

import type { AiConfig, GradingConfig, TitleGenerationConfig } from '../schema';
import {
  validateAiConfig,
  validateGradingConfig,
  validateTitleGenerationConfig,
} from './aiConfig';

const validGradingConfig: GradingConfig = {
  mode: 'live',
  temperature: 0.4,
  runs: [
    { model: 'x-ai/grok-4' },
    { model: 'x-ai/grok-4' },
    { model: 'x-ai/grok-4' },
  ],
  outlierThresholdPercent: 10,
  retry: { maxRetries: 3, backoffMs: [5000, 15000, 45000] },
  maxTokens: 8192,
};

const validTitleConfig: TitleGenerationConfig = {
  model: 'anthropic/claude-haiku',
  temperature: 0.4,
  maxTokens: 14,
};

describe('AI config validation', () => {
  describe('validateGradingConfig', () => {
    it('accepts valid config', () => {
      const result = validateGradingConfig(validGradingConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    describe('temperature', () => {
      it('errors when out of [0, 1] range', () => {
        const tooLow = validateGradingConfig({ ...validGradingConfig, temperature: -0.1 });
        const tooHigh = validateGradingConfig({ ...validGradingConfig, temperature: 1.1 });

        expect(tooLow.valid).toBe(false);
        expect(tooHigh.valid).toBe(false);
      });

      it('warns when above 0.5', () => {
        const result = validateGradingConfig({ ...validGradingConfig, temperature: 0.7 });

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('Temperature'))).toBe(true);
      });
    });

    describe('runs count', () => {
      it('errors when less than 1 or more than 10', () => {
        const empty = validateGradingConfig({ ...validGradingConfig, runs: [] });
        const tooMany = validateGradingConfig({
          ...validGradingConfig,
          runs: Array.from({ length: 11 }, () => ({ model: 'x-ai/grok-4' })),
        });

        expect(empty.valid).toBe(false);
        expect(tooMany.valid).toBe(false);
      });

      it('warns when less than 3 or more than 5', () => {
        const tooFew = validateGradingConfig({
          ...validGradingConfig,
          runs: [{ model: 'x-ai/grok-4' }],
        });
        const tooManyButValid = validateGradingConfig({
          ...validGradingConfig,
          runs: Array.from({ length: 7 }, () => ({ model: 'x-ai/grok-4' })),
        });

        expect(tooFew.valid).toBe(true);
        expect(tooFew.warnings.length).toBeGreaterThan(0);
        expect(tooManyButValid.valid).toBe(true);
        expect(tooManyButValid.warnings.length).toBeGreaterThan(0);
      });
    });

    describe('model format', () => {
      it('warns when model lacks provider/model format', () => {
        const result = validateGradingConfig({
          ...validGradingConfig,
          runs: [{ model: 'grok-4' }], // missing provider prefix
        });

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('provider/model'))).toBe(true);
      });
    });

    describe('outlier threshold', () => {
      it('errors when out of [0, 100] range', () => {
        const negative = validateGradingConfig({ ...validGradingConfig, outlierThresholdPercent: -1 });
        const tooHigh = validateGradingConfig({ ...validGradingConfig, outlierThresholdPercent: 101 });

        expect(negative.valid).toBe(false);
        expect(tooHigh.valid).toBe(false);
      });
    });

    describe('retry config', () => {
      it('errors when maxRetries is negative', () => {
        const result = validateGradingConfig({
          ...validGradingConfig,
          retry: { maxRetries: -1, backoffMs: [] },
        });

        expect(result.valid).toBe(false);
      });

      it('warns when backoffMs empty but maxRetries > 0', () => {
        const result = validateGradingConfig({
          ...validGradingConfig,
          retry: { maxRetries: 3, backoffMs: [] },
        });

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('backoffMs'))).toBe(true);
      });
    });

    describe('maxTokens', () => {
      it('errors when less than 1', () => {
        const result = validateGradingConfig({ ...validGradingConfig, maxTokens: 0 });

        expect(result.valid).toBe(false);
      });

      it('warns when below 256', () => {
        const result = validateGradingConfig({ ...validGradingConfig, maxTokens: 100 });

        expect(result.valid).toBe(true);
        expect(result.warnings.some(w => w.includes('256'))).toBe(true);
      });
    });
  });

  describe('validateTitleGenerationConfig', () => {
    it('accepts valid config', () => {
      const result = validateTitleGenerationConfig(validTitleConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('errors when temperature out of range', () => {
      const result = validateTitleGenerationConfig({ ...validTitleConfig, temperature: 1.5 });

      expect(result.valid).toBe(false);
    });

    it('warns when model lacks provider/model format', () => {
      const result = validateTitleGenerationConfig({ ...validTitleConfig, model: 'claude-haiku' });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('provider/model'))).toBe(true);
    });

    it('errors when maxTokens less than 1', () => {
      const result = validateTitleGenerationConfig({ ...validTitleConfig, maxTokens: 0 });

      expect(result.valid).toBe(false);
    });

    it('warns when maxTokens above 100', () => {
      const result = validateTitleGenerationConfig({ ...validTitleConfig, maxTokens: 150 });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('high'))).toBe(true);
    });
  });

  describe('validateAiConfig', () => {
    const validConfig: AiConfig = {
      grading: validGradingConfig,
      titleGeneration: validTitleConfig,
    };

    it('accepts valid complete config', () => {
      const result = validateAiConfig(validConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('aggregates errors from both configs', () => {
      const result = validateAiConfig({
        grading: { ...validGradingConfig, temperature: 2 },
        titleGeneration: { ...validTitleConfig, maxTokens: 0 },
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('[grading]'))).toBe(true);
      expect(result.errors.some(e => e.includes('[titleGeneration]'))).toBe(true);
    });

    it('aggregates warnings from both configs', () => {
      const result = validateAiConfig({
        grading: { ...validGradingConfig, temperature: 0.7 },
        titleGeneration: { ...validTitleConfig, maxTokens: 150 },
      });

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('[grading]'))).toBe(true);
      expect(result.warnings.some(w => w.includes('[titleGeneration]'))).toBe(true);
    });
  });
});
