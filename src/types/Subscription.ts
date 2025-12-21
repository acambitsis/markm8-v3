// MarkM8 v3 Credit Types
// Pay-per-essay model: users purchase credit packages (NOT subscriptions)

import type { CREDIT_PACKAGE_ID } from '@/utils/AppConfig';

import type { EnumValues } from './Enum';

export type CreditPackageId = EnumValues<typeof CREDIT_PACKAGE_ID>;

// Transaction types for credit audit log
export const TRANSACTION_TYPE = {
  SIGNUP_BONUS: 'signup_bonus',
  PURCHASE: 'purchase',
  GRADING: 'grading',
  REFUND: 'refund',
} as const;

export type TransactionType = EnumValues<typeof TRANSACTION_TYPE>;

// Credit package for purchase (displayed on pricing page and checkout)
export type CreditPackage = {
  id: CreditPackageId;
  credits: number;
  price: number; // USD
  pricePerCredit: number; // For display (e.g., "$1.00/credit")
};

// User's credit balance state
export type CreditBalance = {
  balance: number; // Available credits
  reserved: number; // Credits reserved for pending grading
  available: number; // balance - reserved (what user can spend)
};

// Credit transaction record (for history display)
export type CreditTransaction = {
  id: string;
  amount: number; // Positive for credits added, negative for credits used
  transactionType: TransactionType;
  description?: string;
  createdAt: Date;
};
