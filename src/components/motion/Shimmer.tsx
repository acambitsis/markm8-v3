'use client';

import { cn } from '@/utils/Helpers';

type ShimmerProps = {
  className?: string;
  width?: string;
  height?: string;
};

export function Shimmer({
  className,
  width = '100%',
  height = '1rem',
}: ShimmerProps) {
  return (
    <div
      className={cn(
        'shimmer rounded-md',
        className,
      )}
      style={{ width, height }}
    />
  );
}
