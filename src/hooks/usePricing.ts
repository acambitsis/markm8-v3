'use client';

import { useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';

/**
 * Hook for fetching public pricing info
 * Used by landing page to display current pricing
 * No authentication required
 */
export function usePricing() {
  const pricing = useQuery(api.platformSettings.getPricing);

  return {
    pricing,
    isLoading: pricing === undefined,
    pricePerEssay: pricing?.pricePerEssayUsd ?? null,
    gradingCost: pricing?.gradingCostPerEssay ?? null,
    creditsPerDollar: pricing?.creditsPerDollar ?? null,
    signupBonusCredits: pricing?.signupBonusCredits ?? null,
  };
}
