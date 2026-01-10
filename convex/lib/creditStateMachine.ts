// Credit state machine - pure functions for state transitions
// Extracted for testability and financial correctness
//
// Flow (deduct at submission):
// - Reserve: balance -= cost, reserved += cost
// - Success: reserved -= cost (balance unchanged)
// - Failure: balance += cost, reserved -= cost (refund)

import { addDecimal, isGreaterOrEqual, subtractDecimal } from './decimal';

/** Represents the current credit state */
export type CreditState = {
  balance: string;
  reserved: string;
};

/** Result of a state transition that can fail */
export type TransitionResult =
  | { success: true; state: CreditState }
  | { success: false; error: string };

/**
 * Reserve credit for grading
 * Deducts from balance immediately, tracks in reserved
 *
 * @returns New state or error if insufficient balance
 */
export function reserveCredit(current: CreditState, cost: string): TransitionResult {
  if (!isGreaterOrEqual(current.balance, cost)) {
    return {
      success: false,
      error: `Insufficient credits. Need ${cost} but only have ${current.balance} available.`,
    };
  }

  return {
    success: true,
    state: {
      balance: subtractDecimal(current.balance, cost),
      reserved: addDecimal(current.reserved, cost),
    },
  };
}

/**
 * Clear reservation after successful grading
 * Balance was already deducted, just clear reserved
 */
export function clearReservation(current: CreditState, cost: string): CreditState {
  return {
    balance: current.balance,
    reserved: subtractDecimal(current.reserved, cost),
  };
}

/**
 * Refund reservation after failed grading
 * Restore balance and clear reserved
 */
export function refundReservation(current: CreditState, cost: string): CreditState {
  return {
    balance: addDecimal(current.balance, cost),
    reserved: subtractDecimal(current.reserved, cost),
  };
}

/**
 * Check if user can afford grading
 * Convenience function for pre-validation
 */
export function canAffordGrading(current: CreditState, cost: string): boolean {
  return isGreaterOrEqual(current.balance, cost);
}

/**
 * Apply a purchase to the credit state
 * Adds credits to balance
 */
export function applyPurchase(current: CreditState, amount: string): CreditState {
  return {
    balance: addDecimal(current.balance, amount),
    reserved: current.reserved,
  };
}
