import type { LocalePrefix } from 'node_modules/next-intl/dist/types/src/routing/types';

import type { CreditPackage } from '@/types/Subscription';

const localePrefix: LocalePrefix = 'as-needed';

// MarkM8 Application Configuration
export const AppConfig = {
  name: 'MarkM8',
  locales: [
    {
      id: 'en',
      name: 'English',
    },
    { id: 'fr', name: 'Français' },
  ],
  defaultLocale: 'en',
  localePrefix,
};

export const AllLocales = AppConfig.locales.map(locale => locale.id);

// =============================================================================
// Credit Packages (Pay-per-essay pricing)
// =============================================================================

export const CREDIT_PACKAGE_ID = {
  SINGLE: 'single',
  STARTER: 'starter',
  STANDARD: 'standard',
  BULK: 'bulk',
  MEGA: 'mega',
} as const;

// Credit packages - fixed rate: $1.00 per credit (no discounts)
export const CreditPackageList: Record<string, CreditPackage> = {
  [CREDIT_PACKAGE_ID.SINGLE]: {
    id: CREDIT_PACKAGE_ID.SINGLE,
    credits: 1,
    price: 1.00,
    pricePerCredit: 1.00,
  },
  [CREDIT_PACKAGE_ID.STARTER]: {
    id: CREDIT_PACKAGE_ID.STARTER,
    credits: 5,
    price: 5.00,
    pricePerCredit: 1.00,
  },
  [CREDIT_PACKAGE_ID.STANDARD]: {
    id: CREDIT_PACKAGE_ID.STANDARD,
    credits: 10,
    price: 10.00,
    pricePerCredit: 1.00,
  },
  [CREDIT_PACKAGE_ID.BULK]: {
    id: CREDIT_PACKAGE_ID.BULK,
    credits: 25,
    price: 25.00,
    pricePerCredit: 1.00,
  },
  [CREDIT_PACKAGE_ID.MEGA]: {
    id: CREDIT_PACKAGE_ID.MEGA,
    credits: 50,
    price: 50.00,
    pricePerCredit: 1.00,
  },
};

// Get credit package by ID
export function getCreditPackage(id: string): CreditPackage | undefined {
  return CreditPackageList[id];
}

// Get all credit packages as array (sorted by credits ascending)
export function getAllCreditPackages(): CreditPackage[] {
  return Object.values(CreditPackageList).sort((a, b) => a.credits - b.credits);
}
