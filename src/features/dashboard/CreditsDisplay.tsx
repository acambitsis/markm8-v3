'use client';

import { Coins } from 'lucide-react';
import Link from 'next/link';

import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/utils/Helpers';

export function CreditsDisplay() {
  const { credits, isLoading } = useCredits();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
        <Coins className="size-4 animate-pulse" />
        <span className="w-10 animate-pulse rounded bg-muted">&nbsp;</span>
      </div>
    );
  }

  const available = credits?.available ?? '0.00';
  const numericValue = Number.parseFloat(available);
  const isLow = numericValue < 1;

  return (
    <Link
      href="/settings"
      className={cn(
        'group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
        isLow
          ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
          : 'bg-primary/10 text-primary hover:bg-primary/20',
      )}
    >
      <Coins className="size-4" />
      <span className="tabular-nums">{available}</span>
      <span className="text-xs opacity-70">credits</span>
    </Link>
  );
}
