// Credit state machine tests
// Tests financial correctness of credit reservation flow
// Catches bugs that cause double-charging or lost refunds

import { describe, expect, it } from 'vitest';

import {
  applyPurchase,
  canAffordGrading,
  clearReservation,
  type CreditState,
  refundReservation,
  reserveCredit,
} from './creditStateMachine';

describe('credit state machine', () => {
  // Common test fixtures
  const initialState: CreditState = { balance: '10.00', reserved: '0.00' };
  const gradingCost = '1.00';

  describe('reserveCredit', () => {
    it('deducts from balance and adds to reserved', () => {
      const result = reserveCredit(initialState, gradingCost);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.state.balance).toBe('9.00');
        expect(result.state.reserved).toBe('1.00');
      }
    });

    it('works with various costs', () => {
      const result = reserveCredit(initialState, '5.50');

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.state.balance).toBe('4.50');
        expect(result.state.reserved).toBe('5.50');
      }
    });

    it('allows reserving entire balance', () => {
      const result = reserveCredit(initialState, '10.00');

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.state.balance).toBe('0.00');
        expect(result.state.reserved).toBe('10.00');
      }
    });

    it('preserves existing reserved amount', () => {
      const stateWithReserved: CreditState = { balance: '8.00', reserved: '2.00' };
      const result = reserveCredit(stateWithReserved, gradingCost);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.state.balance).toBe('7.00');
        expect(result.state.reserved).toBe('3.00');
      }
    });
  });

  describe('insufficient balance rejection', () => {
    it('rejects when balance is less than cost', () => {
      const lowBalance: CreditState = { balance: '0.50', reserved: '0.00' };
      const result = reserveCredit(lowBalance, gradingCost);

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error).toContain('Insufficient credits');
        expect(result.error).toContain('Need 1.00');
        expect(result.error).toContain('only have 0.50');
      }
    });

    it('rejects when balance is zero', () => {
      const zeroBalance: CreditState = { balance: '0.00', reserved: '0.00' };
      const result = reserveCredit(zeroBalance, gradingCost);

      expect(result.success).toBe(false);
    });

    it('rejects when balance is exactly one cent short', () => {
      const almostEnough: CreditState = { balance: '0.99', reserved: '0.00' };
      const result = reserveCredit(almostEnough, gradingCost);

      expect(result.success).toBe(false);
    });

    it('does not modify state on rejection', () => {
      const lowBalance: CreditState = { balance: '0.50', reserved: '0.00' };
      const result = reserveCredit(lowBalance, gradingCost);

      expect(result.success).toBe(false);
      // Original state should be unchanged (pure function, no side effects)
      expect(lowBalance.balance).toBe('0.50');
      expect(lowBalance.reserved).toBe('0.00');
    });
  });

  describe('clearReservation (success path)', () => {
    it('clears reserved amount without changing balance', () => {
      const afterReserve: CreditState = { balance: '9.00', reserved: '1.00' };
      const result = clearReservation(afterReserve, gradingCost);

      expect(result.balance).toBe('9.00'); // Balance unchanged
      expect(result.reserved).toBe('0.00'); // Reserved cleared
    });

    it('handles partial clearing of reserved', () => {
      const multipleReserved: CreditState = { balance: '7.00', reserved: '3.00' };
      const result = clearReservation(multipleReserved, gradingCost);

      expect(result.balance).toBe('7.00');
      expect(result.reserved).toBe('2.00');
    });

    it('preserves balance when clearing larger reservation', () => {
      const largeReserved: CreditState = { balance: '5.00', reserved: '5.00' };
      const result = clearReservation(largeReserved, '5.00');

      expect(result.balance).toBe('5.00');
      expect(result.reserved).toBe('0.00');
    });
  });

  describe('refundReservation (failure path)', () => {
    it('restores balance and clears reserved', () => {
      const afterReserve: CreditState = { balance: '9.00', reserved: '1.00' };
      const result = refundReservation(afterReserve, gradingCost);

      expect(result.balance).toBe('10.00'); // Balance restored
      expect(result.reserved).toBe('0.00'); // Reserved cleared
    });

    it('restores exact amount', () => {
      const afterReserve: CreditState = { balance: '4.50', reserved: '5.50' };
      const result = refundReservation(afterReserve, '5.50');

      expect(result.balance).toBe('10.00');
      expect(result.reserved).toBe('0.00');
    });

    it('handles partial refund with remaining reserved', () => {
      const multipleReserved: CreditState = { balance: '7.00', reserved: '3.00' };
      const result = refundReservation(multipleReserved, gradingCost);

      expect(result.balance).toBe('8.00');
      expect(result.reserved).toBe('2.00');
    });
  });

  describe('complete grading flow', () => {
    it('reserve -> clear maintains correct final state (success)', () => {
      // Start with 10.00 balance
      let state = initialState;

      // Reserve 1.00 for grading
      const reserveResult = reserveCredit(state, gradingCost);

      expect(reserveResult.success).toBe(true);

      if (!reserveResult.success) {
        return;
      }
      state = reserveResult.state;

      expect(state.balance).toBe('9.00');
      expect(state.reserved).toBe('1.00');

      // Grading succeeds - clear reservation
      state = clearReservation(state, gradingCost);

      expect(state.balance).toBe('9.00'); // Credit spent
      expect(state.reserved).toBe('0.00');
    });

    it('reserve -> refund restores original state (failure)', () => {
      // Start with 10.00 balance
      let state = initialState;

      // Reserve 1.00 for grading
      const reserveResult = reserveCredit(state, gradingCost);

      expect(reserveResult.success).toBe(true);

      if (!reserveResult.success) {
        return;
      }
      state = reserveResult.state;

      expect(state.balance).toBe('9.00');
      expect(state.reserved).toBe('1.00');

      // Grading fails - refund reservation
      state = refundReservation(state, gradingCost);

      expect(state.balance).toBe('10.00'); // Credit restored
      expect(state.reserved).toBe('0.00');
    });

    it('handles multiple concurrent gradings', () => {
      let state = initialState;

      // Reserve for first grading
      const reserve1 = reserveCredit(state, gradingCost);

      expect(reserve1.success).toBe(true);

      if (!reserve1.success) {
        return;
      }
      state = reserve1.state;

      // Reserve for second grading
      const reserve2 = reserveCredit(state, gradingCost);

      expect(reserve2.success).toBe(true);

      if (!reserve2.success) {
        return;
      }
      state = reserve2.state;

      expect(state.balance).toBe('8.00');
      expect(state.reserved).toBe('2.00');

      // First grading succeeds
      state = clearReservation(state, gradingCost);

      expect(state.balance).toBe('8.00');
      expect(state.reserved).toBe('1.00');

      // Second grading fails
      state = refundReservation(state, gradingCost);

      expect(state.balance).toBe('9.00');
      expect(state.reserved).toBe('0.00');
    });
  });

  describe('no double-charging', () => {
    it('only deducts once during reserve', () => {
      const result = reserveCredit(initialState, gradingCost);

      expect(result.success).toBe(true);

      if (!result.success) {
        return;
      }

      // Balance should only be reduced by cost once
      expect(result.state.balance).toBe('9.00');

      // Calling reserve again on same state would be idempotent
      // (In practice, DB prevents double-reserve via transactions)
      const secondReserve = reserveCredit(initialState, gradingCost);

      expect(secondReserve.success).toBe(true);

      if (!secondReserve.success) {
        return;
      }

      expect(secondReserve.state.balance).toBe('9.00');
    });

    it('clear does not deduct additional credits', () => {
      const afterReserve: CreditState = { balance: '9.00', reserved: '1.00' };
      const result = clearReservation(afterReserve, gradingCost);

      // Balance should remain the same (already deducted during reserve)
      expect(result.balance).toBe('9.00');
    });
  });

  describe('canAffordGrading', () => {
    it('returns true when balance >= cost', () => {
      expect(canAffordGrading(initialState, gradingCost)).toBe(true);
      expect(canAffordGrading(initialState, '10.00')).toBe(true);
    });

    it('returns false when balance < cost', () => {
      expect(canAffordGrading(initialState, '10.01')).toBe(false);
      expect(canAffordGrading({ balance: '0.00', reserved: '0.00' }, gradingCost)).toBe(false);
    });
  });

  describe('applyPurchase', () => {
    it('adds credits to balance', () => {
      const result = applyPurchase(initialState, '5.00');

      expect(result.balance).toBe('15.00');
      expect(result.reserved).toBe('0.00');
    });

    it('preserves reserved amount', () => {
      const stateWithReserved: CreditState = { balance: '9.00', reserved: '1.00' };
      const result = applyPurchase(stateWithReserved, '5.00');

      expect(result.balance).toBe('14.00');
      expect(result.reserved).toBe('1.00');
    });
  });

  describe('edge cases', () => {
    it('handles zero cost (free grading)', () => {
      const result = reserveCredit(initialState, '0.00');

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.state.balance).toBe('10.00');
        expect(result.state.reserved).toBe('0.00');
      }
    });

    it('handles fractional cents correctly', () => {
      const result = reserveCredit(initialState, '0.99');

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.state.balance).toBe('9.01');
        expect(result.state.reserved).toBe('0.99');
      }
    });

    it('avoids floating point errors', () => {
      // Classic floating point problem: 0.1 + 0.2 !== 0.3 in JS
      const state: CreditState = { balance: '0.30', reserved: '0.00' };
      const reserve1 = reserveCredit(state, '0.10');

      expect(reserve1.success).toBe(true);

      if (!reserve1.success) {
        return;
      }

      const reserve2 = reserveCredit(reserve1.state, '0.20');

      expect(reserve2.success).toBe(true);

      if (!reserve2.success) {
        return;
      }

      expect(reserve2.state.balance).toBe('0.00');
      expect(reserve2.state.reserved).toBe('0.30');
    });
  });
});
