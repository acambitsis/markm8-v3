'use client';

import { Coins } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/utils/Helpers';

export function SubmitPageHeader() {
  const { credits, isLoading } = useCredits();
  const balance = Number.parseFloat(credits?.available ?? '0');
  const hasEnoughCredits = balance >= 1.0;

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Submit Your Essay
        </h1>
        <p className="mt-2 text-muted-foreground">
          Get detailed AI feedback to improve your writing
        </p>
      </div>

      {/* Cost and balance display */}
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Coins className="size-5 text-primary" />
          <span className="text-sm font-medium">Cost:</span>
          <Badge variant="secondary" className="font-mono">
            1.00
          </Badge>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Balance:</span>
          {isLoading
            ? (
                <Skeleton className="h-5 w-12" />
              )
            : (
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono',
                    hasEnoughCredits
                      ? 'border-green-500/50 text-green-600'
                      : 'border-red-500/50 text-red-600',
                  )}
                >
                  {credits?.available ?? '0.00'}
                </Badge>
              )}
        </div>
      </div>
    </div>
  );
}
