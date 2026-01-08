import type { CreditPackage } from '@/types/Subscription';

const localePrefix = 'as-needed' as const;

// MarkM8 Application Configuration
export const AppConfig = {
  name: 'MarkM8',
  locales: [
    {
      id: 'en',
      name: 'English',
      ogLocale: 'en_US', // Open Graph locale format
    },
    {
      id: 'fr',
      name: 'Français',
      ogLocale: 'fr_FR',
    },
  ],
  defaultLocale: 'en',
  localePrefix,
  // SEO defaults (English fallback for root layout metadata)
  seo: {
    title: 'AI Essay Grading for Students',
    description: 'Get instant AI-powered essay feedback aligned with university grading standards. Three AI models, one comprehensive grade. Just $1 per essay.',
    descriptionShort: 'Get instant AI-powered essay feedback aligned with university grading standards. Three AI models, one comprehensive grade.',
  },
};

export const AllLocales = AppConfig.locales.map(locale => locale.id);

// Get Open Graph locale for a given locale ID (e.g., 'en' -> 'en_US')
// Throws if locale is not found to fail fast on invalid input
export function getOgLocale(localeId: string): string {
  const locale = AppConfig.locales.find(l => l.id === localeId);
  if (!locale) {
    throw new Error(`Unknown locale: ${localeId}. Valid locales: ${AllLocales.join(', ')}`);
  }
  return locale.ogLocale;
}

// Get all OG locales except the specified one (for alternateLocale)
// Throws if locale is not found to fail fast on invalid input
export function getAlternateOgLocales(currentLocaleId: string): string[] {
  const locale = AppConfig.locales.find(l => l.id === currentLocaleId);
  if (!locale) {
    throw new Error(`Unknown locale: ${currentLocaleId}. Valid locales: ${AllLocales.join(', ')}`);
  }
  return AppConfig.locales
    .filter(l => l.id !== currentLocaleId)
    .map(l => l.ogLocale);
}

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
