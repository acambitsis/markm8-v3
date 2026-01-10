'use client';

import { useConvexAuth, useMutation, useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';

/**
 * Hook to get and update the current user's profile
 * Uses Convex real-time subscription - no polling needed!
 * Skips the query until the user is authenticated to avoid race conditions
 */
export function useProfile() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const profile = useQuery(
    api.users.getProfile,
    isAuthenticated ? {} : 'skip',
  );
  const updateProfile = useMutation(api.users.updateProfile);

  const isQueryLoading = isAuthenticated && profile === undefined;

  return {
    profile,
    updateProfile,
    isLoading: isAuthLoading || isQueryLoading,
    isAuthLoading,
    isAuthenticated,
  };
}
