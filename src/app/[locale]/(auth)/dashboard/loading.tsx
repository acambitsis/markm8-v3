import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <>
      {/* TitleBar skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      {/* Content skeleton - matches MessageState layout */}
      <div className="flex flex-col items-center justify-center py-16">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="mt-6 h-6 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
    </>
  );
}
