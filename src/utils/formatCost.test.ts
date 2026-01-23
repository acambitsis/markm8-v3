import { formatApiCost, formatTokens } from './formatCost';

describe('formatCost', () => {
  describe('formatApiCost', () => {
    it('should return "-" for undefined', () => {
      expect(formatApiCost(undefined)).toBe('-');
    });

    it('should return "-" for empty string', () => {
      expect(formatApiCost('')).toBe('-');
    });

    it('should return "-" for zero', () => {
      expect(formatApiCost('0')).toBe('-');
      expect(formatApiCost('0.00')).toBe('-');
    });

    it('should return "-" for NaN', () => {
      expect(formatApiCost('not-a-number')).toBe('-');
    });

    it('should format very small amounts with 4 decimals', () => {
      expect(formatApiCost('0.0037')).toBe('$0.0037');
      expect(formatApiCost('0.0001')).toBe('$0.0001');
      expect(formatApiCost('0.0099')).toBe('$0.0099');
    });

    it('should format small amounts with 3 decimals', () => {
      expect(formatApiCost('0.01')).toBe('$0.010');
      expect(formatApiCost('0.037')).toBe('$0.037');
      expect(formatApiCost('0.999')).toBe('$0.999');
    });

    it('should format larger amounts with 2 decimals', () => {
      expect(formatApiCost('1.00')).toBe('$1.00');
      expect(formatApiCost('1.25')).toBe('$1.25');
      expect(formatApiCost('10.50')).toBe('$10.50');
    });
  });

  describe('formatTokens', () => {
    it('should return "-" for undefined', () => {
      expect(formatTokens(undefined)).toBe('-');
    });

    it('should return "-" for zero', () => {
      expect(formatTokens(0)).toBe('-');
    });

    it('should format small numbers as-is', () => {
      expect(formatTokens(1)).toBe('1');
      expect(formatTokens(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatTokens(1000)).toBe('1.0K');
      expect(formatTokens(1500)).toBe('1.5K');
      expect(formatTokens(25000)).toBe('25.0K');
      expect(formatTokens(999999)).toBe('1000.0K');
    });

    it('should format millions with M suffix', () => {
      expect(formatTokens(1000000)).toBe('1.0M');
      expect(formatTokens(2500000)).toBe('2.5M');
      expect(formatTokens(10000000)).toBe('10.0M');
    });
  });
});
