'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Skeleton } from '@/components/Skeleton';
import { useAdminCheck } from '@/hooks/useAdmin';

type AdminGuardProps = {
  children: React.ReactNode;
};

/**
 * Guard component that restricts access to admin-only content
 * Redirects non-admins to the dashboard with an error message
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, isLoading, isAuthenticated } = useAdminCheck();
  const router = useRouter();

  useEffect(() => {
    // Wait for loading to complete before redirecting
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isAdmin, isLoading, isAuthenticated, router]);

  // Show loading skeleton while checking admin status
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Don't render children if not admin (will redirect)
  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return children;
}
