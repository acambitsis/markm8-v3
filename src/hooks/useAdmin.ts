'use client';

import type { Id } from 'convex/_generated/dataModel';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';
import type { AuditAction, TransactionType } from '../../convex/schema';

/**
 * Hook to check if the current user is an admin
 * Uses Convex real-time subscription
 */
export function useAdminCheck() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const isAdmin = useQuery(
    api.admin.checkIsAdmin,
    isAuthenticated ? {} : 'skip',
  );

  const isQueryLoading = isAuthenticated && isAdmin === undefined;

  return {
    isAdmin: isAdmin ?? false,
    isLoading: isAuthLoading || isQueryLoading,
    isAuthenticated,
  };
}

/**
 * Hook to get admin dashboard statistics
 */
export function useAdminDashboardStats() {
  const { isAuthenticated } = useConvexAuth();
  const stats = useQuery(
    api.admin.getDashboardStats,
    isAuthenticated ? {} : 'skip',
  );

  return {
    stats,
    isLoading: stats === undefined,
  };
}

/**
 * Hook to get recent activity for admin dashboard
 */
export function useAdminRecentActivity(limit = 10) {
  const { isAuthenticated } = useConvexAuth();
  const activity = useQuery(
    api.admin.getRecentActivity,
    isAuthenticated ? { limit } : 'skip',
  );

  return {
    activity: activity ?? [],
    isLoading: activity === undefined,
  };
}

/**
 * Hook to get paginated user list with search
 */
export function useAdminUsers(search?: string) {
  const { isAuthenticated } = useConvexAuth();
  const users = useQuery(
    api.admin.getUsers,
    isAuthenticated ? { search, limit: 50 } : 'skip',
  );

  return {
    users: users ?? [],
    isLoading: users === undefined,
  };
}

/**
 * Hook to get detailed user information
 */
export function useAdminUserDetail(userId: Id<'users'> | null) {
  const { isAuthenticated } = useConvexAuth();
  const userDetail = useQuery(
    api.admin.getUserDetail,
    isAuthenticated && userId ? { userId } : 'skip',
  );

  return {
    userDetail,
    isLoading: userDetail === undefined,
  };
}

/**
 * Hook to get filtered transaction log
 */
export function useAdminTransactions(filters?: {
  userId?: Id<'users'>;
  transactionType?: TransactionType;
  limit?: number;
}) {
  const { isAuthenticated } = useConvexAuth();
  const transactions = useQuery(
    api.admin.getTransactions,
    isAuthenticated
      ? {
          userId: filters?.userId,
          transactionType: filters?.transactionType,
          limit: filters?.limit ?? 50,
        }
      : 'skip',
  );

  return {
    transactions: transactions ?? [],
    isLoading: transactions === undefined,
  };
}

/**
 * Hook to get platform settings
 */
export function useAdminPlatformSettings() {
  const { isAuthenticated } = useConvexAuth();
  const settings = useQuery(
    api.admin.getPlatformSettings,
    isAuthenticated ? {} : 'skip',
  );

  return {
    settings,
    isLoading: settings === undefined,
  };
}

/**
 * Hook to get admin audit log
 */
export function useAdminAuditLog(filters?: {
  action?: AuditAction;
  limit?: number;
}) {
  const { isAuthenticated } = useConvexAuth();
  const auditLog = useQuery(
    api.admin.getAuditLog,
    isAuthenticated
      ? {
          action: filters?.action,
          limit: filters?.limit ?? 50,
        }
      : 'skip',
  );

  return {
    auditLog: auditLog ?? [],
    isLoading: auditLog === undefined,
  };
}

/**
 * Hook for admin mutations
 */
export function useAdminMutations() {
  const adjustCredits = useMutation(api.admin.adjustCredits);
  const updatePlatformSettings = useMutation(api.admin.updatePlatformSettings);
  const addAdminEmail = useMutation(api.admin.addAdminEmail);
  const removeAdminEmail = useMutation(api.admin.removeAdminEmail);

  return {
    adjustCredits,
    updatePlatformSettings,
    addAdminEmail,
    removeAdminEmail,
  };
}
