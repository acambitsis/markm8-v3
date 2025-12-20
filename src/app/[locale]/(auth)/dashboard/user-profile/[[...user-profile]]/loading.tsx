import { Skeleton } from '@/components/ui/skeleton';

export default function UserProfileLoading() {
  return (
    <>
      {/* TitleBar skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      {/* Clerk UserProfile skeleton */}
      <div className="flex w-full gap-4">
        {/* Sidebar skeleton */}
        <div className="w-64 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </>
  );
}
