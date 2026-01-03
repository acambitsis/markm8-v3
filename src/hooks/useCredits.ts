'use client';

import { useConvexAuth, useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';

/**
 * Hook to get the current user's credit balance
 * Uses Convex real-time subscription - no polling needed!
 * Skips the query until the user is authenticated to avoid race conditions
 *
 * Loading states:
 * - isAuthLoading: true while Clerk/Convex auth is syncing
 * - isLoading: true while auth is loading OR query is in flight
 */
export function useCredits() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const credits = useQuery(
    api.credits.getBalance,
    isAuthenticated ? {} : 'skip',
  );

  // Query is loading if:
  // 1. Auth is still loading (we haven't started the query yet), OR
  // 2. Auth completed and we're authenticated but query hasn't returned yet
  const isQueryLoading = isAuthenticated && credits === undefined;

  return {
    credits,
    isLoading: isAuthLoading || isQueryLoading,
    isAuthLoading,
    isError: credits === null,
    isAuthenticated,
    // No refresh needed - Convex subscriptions auto-update
  };
}
