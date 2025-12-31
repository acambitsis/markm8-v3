'use client';

import { useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';

/**
 * Hook to get the current user's credit balance
 * Uses Convex real-time subscription - no polling needed!
 */
export function useCredits() {
  const credits = useQuery(api.credits.getBalance);

  return {
    credits,
    isLoading: credits === undefined,
    isError: credits === null,
    // No refresh needed - Convex subscriptions auto-update
  };
}
