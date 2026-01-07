'use client';

import { Coins } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/utils/Helpers';

export function SubmitPageHeader() {
  const { credits, isLoading } = useCredits();
  const gradingCost = credits?.gradingCost ? Number.parseFloat(credits.gradingCost) : null;
  const balance = credits?.available ? Number.parseFloat(credits.available) : null;
  const hasEnoughCredits = gradingCost !== null && balance !== null && balance >= gradingCost;

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
          {isLoading || gradingCost === null
            ? (
                <Skeleton className="h-5 w-12" />
              )
            : (
                <Badge variant="secondary" className="font-mono">
                  {credits?.gradingCost}
                </Badge>
              )}
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Balance:</span>
          {isLoading || balance === null
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
                  {credits?.available}
                </Badge>
              )}
        </div>
      </div>
    </div>
  );
}
