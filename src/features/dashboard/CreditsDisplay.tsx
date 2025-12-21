'use client';

import { Coins } from 'lucide-react';

import { useCredits } from '@/hooks/useCredits';

export function CreditsDisplay() {
  const { credits, isLoading } = useCredits();

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground">
        <Coins className="size-4" />
        <span className="animate-pulse">...</span>
      </div>
    );
  }

  const available = credits?.available ?? '0.00';

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-sm font-medium">
      <Coins className="size-4 text-amber-500" />
      <span>{available}</span>
    </div>
  );
}
