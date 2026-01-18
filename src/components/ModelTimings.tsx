'use client';

import { ChevronDown, Clock, Sparkles } from 'lucide-react';
import { useState } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/utils/Helpers';

import type { ModelResult } from '../../convex/schema';

type Props = {
  modelResults: ModelResult[];
  /** Compact mode for inline display (e.g., in transaction lists) */
  compact?: boolean;
  /** Default expanded state */
  defaultOpen?: boolean;
  /** Custom trigger className */
  triggerClassName?: string;
};

/**
 * Format duration in a human-readable way
 */
function formatDuration(ms: number | undefined): string {
  if (ms === undefined) {
    return '-';
  }
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(0);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Extract short model name from full slug (e.g., "openai/gpt-5.2-pro" -> "GPT 5.2 Pro")
 */
function getShortModelName(slug: string): string {
  const name = slug.split('/').pop() ?? slug;
  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Calculate total grading time (max of all durations since they run in parallel)
 */
function getTotalTime(modelResults: ModelResult[]): number | undefined {
  const durations = modelResults.map(r => r.durationMs).filter((d): d is number => d !== undefined);
  if (durations.length === 0) {
    return undefined;
  }
  return Math.max(...durations);
}

/**
 * Reusable component for displaying model grading timings
 * Can be used in both admin and user-facing views
 */
export function ModelTimings({
  modelResults,
  compact = false,
  defaultOpen = false,
  triggerClassName,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const totalTime = getTotalTime(modelResults);
  const hasDurations = modelResults.some(r => r.durationMs !== undefined);

  // Don't render if no results
  if (modelResults.length === 0) {
    return null;
  }

  // Compact mode: just show total time inline
  if (compact && !hasDurations) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Sparkles className="size-3" />
        {modelResults.length}
        {' '}
        model
        {modelResults.length !== 1 ? 's' : ''}
      </span>
    );
  }

  if (compact) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          className={cn(
            'inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground',
            triggerClassName,
          )}
        >
          <Clock className="size-3" />
          <span className="tabular-nums">{formatDuration(totalTime)}</span>
          <ChevronDown className={cn('size-3 transition-transform', isOpen && 'rotate-180')} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1">
          <div className="rounded border bg-muted/30 p-2 text-xs">
            <div className="space-y-1">
              {modelResults.map((result, index) => (
                <div
                  key={index} // eslint-disable-line react/no-array-index-key -- display-only
                  className="flex items-center justify-between gap-4"
                >
                  <span className={cn('truncate', !result.included && 'text-muted-foreground/60 line-through')}>
                    {getShortModelName(result.model)}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatDuration(result.durationMs)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Full mode: show expandable card-like section
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-center gap-1.5 rounded-md bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground/70 transition-colors hover:bg-muted/50 hover:text-muted-foreground',
          triggerClassName,
        )}
      >
        <Sparkles className="size-3" />
        <span className="font-medium">
          {modelResults.length}
          {' '}
          grading run
          {modelResults.length !== 1 ? 's' : ''}
        </span>
        {hasDurations && (
          <>
            <span className="text-muted-foreground/50">·</span>
            <Clock className="size-3" />
            <span className="tabular-nums">{formatDuration(totalTime)}</span>
          </>
        )}
        <ChevronDown className={cn('size-3 transition-transform', isOpen && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1.5">
        <div className="flex flex-col gap-1">
          {modelResults.map((result, index) => (
            <div
              key={index} // eslint-disable-line react/no-array-index-key -- display-only
              className={cn(
                'flex items-center justify-between rounded bg-muted/40 px-2 py-0.5 text-[10px]',
                !result.included && 'opacity-50',
              )}
            >
              <span className="text-muted-foreground">
                <span className="font-medium">
                  Run
                  {' '}
                  {index + 1}
                  :
                </span>
                {' '}
                {result.model}
                {!result.included && result.reason && (
                  <span className="ml-1 italic">
                    (
                    {result.reason}
                    )
                  </span>
                )}
              </span>
              {result.durationMs !== undefined && (
                <span className="ml-2 shrink-0 tabular-nums text-muted-foreground/70">
                  {formatDuration(result.durationMs)}
                </span>
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
