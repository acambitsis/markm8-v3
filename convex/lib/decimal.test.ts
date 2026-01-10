import { describe, expect, it } from 'vitest';

import {
  addDecimal,
  compareDecimal,
  formatCredits,
  isGreaterOrEqual,
  isNegative,
  isPositive,
  isZero,
  subtractDecimal,
} from './decimal';

describe('decimal arithmetic', () => {
  describe('addDecimal', () => {
    it('adds positive decimals', () => {
      expect(addDecimal('1.00', '2.00')).toBe('3.00');
      expect(addDecimal('1.50', '2.75')).toBe('4.25');
    });

    it('handles zero operands', () => {
      expect(addDecimal('0.00', '5.00')).toBe('5.00');
      expect(addDecimal('5.00', '0.00')).toBe('5.00');
    });

    it('avoids floating point errors', () => {
      expect(addDecimal('0.10', '0.20')).toBe('0.30');
      expect(addDecimal('0.99', '0.01')).toBe('1.00');
    });

    it('handles negative values', () => {
      expect(addDecimal('-1.00', '2.00')).toBe('1.00');
      expect(addDecimal('1.00', '-2.00')).toBe('-1.00');
    });
  });

  describe('subtractDecimal', () => {
    it('subtracts positive decimals', () => {
      expect(subtractDecimal('5.00', '2.00')).toBe('3.00');
      expect(subtractDecimal('5.75', '2.25')).toBe('3.50');
    });

    it('handles zero operands', () => {
      expect(subtractDecimal('5.00', '0.00')).toBe('5.00');
      expect(subtractDecimal('0.00', '5.00')).toBe('-5.00');
    });

    it('avoids floating point errors', () => {
      expect(subtractDecimal('0.30', '0.10')).toBe('0.20');
      expect(subtractDecimal('1.00', '0.01')).toBe('0.99');
    });

    it('returns negative when subtrahend exceeds minuend', () => {
      expect(subtractDecimal('1.00', '2.00')).toBe('-1.00');
    });
  });

  describe('compareDecimal', () => {
    it('returns negative when first is smaller', () => {
      expect(compareDecimal('1.00', '2.00')).toBeLessThan(0);
    });

    it('returns positive when first is larger', () => {
      expect(compareDecimal('2.00', '1.00')).toBeGreaterThan(0);
      expect(compareDecimal('1.50', '1.49')).toBeGreaterThan(0);
    });

    it('returns zero for equal values', () => {
      expect(compareDecimal('1.00', '1.00')).toBe(0);
    });
  });

  describe('isGreaterOrEqual', () => {
    it('returns true when first is greater or equal', () => {
      expect(isGreaterOrEqual('2.00', '1.00')).toBe(true);
      expect(isGreaterOrEqual('1.00', '1.00')).toBe(true);
    });

    it('returns false when first is smaller', () => {
      expect(isGreaterOrEqual('1.00', '2.00')).toBe(false);
      expect(isGreaterOrEqual('0.00', '0.01')).toBe(false);
    });
  });

  describe('isPositive', () => {
    it('returns true for positive values', () => {
      expect(isPositive('1.00')).toBe(true);
      expect(isPositive('0.01')).toBe(true);
    });

    it('returns false for zero and negative values', () => {
      expect(isPositive('0.00')).toBe(false);
      expect(isPositive('-1.00')).toBe(false);
    });
  });

  describe('isNegative', () => {
    it('returns true for negative values', () => {
      expect(isNegative('-1.00')).toBe(true);
      expect(isNegative('-0.01')).toBe(true);
    });

    it('returns false for zero and positive values', () => {
      expect(isNegative('0.00')).toBe(false);
      expect(isNegative('1.00')).toBe(false);
    });
  });

  describe('isZero', () => {
    it('returns true only for zero', () => {
      expect(isZero('0.00')).toBe(true);
      expect(isZero('0.01')).toBe(false);
      expect(isZero('-0.01')).toBe(false);
    });
  });

  describe('formatCredits', () => {
    it('formats values with two decimal places', () => {
      expect(formatCredits('5')).toBe('5.00');
      expect(formatCredits('1.50')).toBe('1.50');
      expect(formatCredits('0')).toBe('0.00');
    });
  });
});
