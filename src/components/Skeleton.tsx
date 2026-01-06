import { cn } from '@/utils/Helpers';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-lg',
        className,
      )}
    />
  );
}

// Pre-built skeleton patterns
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
        <div className="pt-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonListItem({ className }: SkeletonProps) {
  return (
    <div className={cn('flex items-center gap-4 rounded-lg border p-4', className)}>
      <Skeleton className="size-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function SkeletonStats({ className }: SkeletonProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-3', className)}>
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl border bg-card p-6">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGradeResults({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Score gauge skeleton */}
      <div className="flex justify-center py-8">
        <Skeleton className="size-44 rounded-full" />
      </div>
      {/* Cards skeleton */}
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl border bg-card p-6">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
