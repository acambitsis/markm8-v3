'use client';

import { useConvexAuth, useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';

/**
 * Hook to get the current user's credit balance
 * Uses Convex real-time subscription - no polling needed!
 * Skips the query until the user is authenticated to avoid race conditions
 */
export function useCredits() {
  const { isAuthenticated } = useConvexAuth();
  const credits = useQuery(
    api.credits.getBalance,
    isAuthenticated ? {} : 'skip',
  );

  return {
    credits,
    isLoading: credits === undefined,
    isError: credits === null,
    isAuthenticated,
    // No refresh needed - Convex subscriptions auto-update
  };
}
