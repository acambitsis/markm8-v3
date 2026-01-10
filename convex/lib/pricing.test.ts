import { describe, expect, it } from 'vitest';

import {
  calculatePricePerEssay,
  validatePricingValue,
} from './pricing';

describe('pricing', () => {
  describe('validatePricingValue', () => {
    it('returns parsed number for valid positive value', () => {
      expect(validatePricingValue('1.00', 'Test')).toBe(1);
      expect(validatePricingValue('0.50', 'Test')).toBe(0.5);
    });

    it('throws for invalid input', () => {
      expect(() => validatePricingValue('invalid', 'Test')).toThrow(TypeError);
      expect(() => validatePricingValue('', 'Test')).toThrow(TypeError);
    });

    it('throws for zero or negative values', () => {
      expect(() => validatePricingValue('0', 'Test')).toThrow();
      expect(() => validatePricingValue('-1.00', 'Test')).toThrow();
    });
  });

  describe('calculatePricePerEssay', () => {
    it('calculates price correctly', () => {
      // 1 credit / 1 credit per dollar = $1.00
      expect(calculatePricePerEssay('1.00', '1.00')).toBe('1.00');
      // 1 credit / 2 credits per dollar = $0.50
      expect(calculatePricePerEssay('1.00', '2.00')).toBe('0.50');
      // 2 credits / 1 credit per dollar = $2.00
      expect(calculatePricePerEssay('2.00', '1.00')).toBe('2.00');
    });

    it('rounds to 2 decimal places', () => {
      // 1 / 3 = $0.333... -> $0.33
      expect(calculatePricePerEssay('1.00', '3.00')).toBe('0.33');
    });

    it('prevents division by zero', () => {
      expect(() => calculatePricePerEssay('1.00', '0')).toThrow();
    });

    it('rejects invalid inputs', () => {
      expect(() => calculatePricePerEssay('invalid', '1.00')).toThrow();
      expect(() => calculatePricePerEssay('-1.00', '1.00')).toThrow();
    });
  });
});
