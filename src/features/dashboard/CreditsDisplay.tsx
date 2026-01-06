'use client';

import { Coins } from 'lucide-react';
import Link from 'next/link';

import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/utils/Helpers';

export function CreditsDisplay() {
  const { credits, isLoading } = useCredits();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5">
        <div className="size-4 rounded-full bg-amber-500/30 animate-pulse" />
        <div className="h-4 w-8 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  const available = Number.parseFloat(credits?.available ?? '0');
  const isLow = available < 1;

  return (
    <Link
      href="/dashboard/user-profile"
      className={cn(
        'flex items-center gap-2 rounded-full px-3 py-1.5',
        'text-sm font-medium tabular-nums',
        'transition-all duration-200',
        isLow
          ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
          : 'bg-muted/50 text-foreground hover:bg-muted',
      )}
    >
      <Coins className={cn(
        'size-4',
        isLow ? 'text-amber-500' : 'text-amber-500',
      )}
      />
      <span>{credits?.available ?? '0.00'}</span>
    </Link>
  );
}
