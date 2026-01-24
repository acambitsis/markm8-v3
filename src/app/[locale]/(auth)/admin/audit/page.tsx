'use client';

import { motion } from 'framer-motion';
import { ClipboardList, Filter } from 'lucide-react';
import { useState } from 'react';

import { PageTransition } from '@/components/motion/PageTransition';
import { Skeleton } from '@/components/Skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAuditActionStyle } from '@/features/admin/colors';
import { staggerContainer, staggerItem } from '@/features/admin/motion';
import { useAdminAuditLog } from '@/hooks/useAdmin';
import { cn } from '@/utils/Helpers';

import type { AiConfig, AuditAction } from '../../../../../../convex/schema';

type FilterValue = AuditAction | 'all';

// Human-readable labels for audit actions
const actionLabels: Record<AuditAction, string> = {
  pricing_update: 'Pricing',
  signup_bonus_update: 'Signup Bonus',
  admin_email_added: 'Admin Added',
  admin_email_removed: 'Admin Removed',
  ai_config_update: 'AI Config',
  model_added: 'Model Added',
  model_removed: 'Model Removed',
  model_enabled: 'Model Enabled',
  model_disabled: 'Model Disabled',
};

// Get short model name from full OpenRouter model ID
function getShortModelName(modelId: string): string {
  // Extract just the model name part after the provider prefix
  const parts = modelId.split('/');
  return parts[parts.length - 1] ?? modelId;
}

// Describe AI config changes in detail
function getAiConfigChanges(prev: AiConfig, next: AiConfig): string[] {
  const changes: string[] = [];

  // Check grading mode
  if (prev.grading.mode !== next.grading.mode) {
    changes.push(`Mode: ${prev.grading.mode} → ${next.grading.mode}`);
  }

  // Check temperature
  if (prev.grading.temperature !== next.grading.temperature) {
    changes.push(`Temperature: ${prev.grading.temperature} → ${next.grading.temperature}`);
  }

  // Check runs (models and reasoning effort)
  const prevRuns = prev.grading.runs;
  const nextRuns = next.grading.runs;

  if (prevRuns.length !== nextRuns.length) {
    changes.push(`Runs: ${prevRuns.length} → ${nextRuns.length}`);
  }

  // Compare each run for model/reasoning changes
  const maxRuns = Math.max(prevRuns.length, nextRuns.length);
  for (let i = 0; i < maxRuns; i++) {
    const prevRun = prevRuns[i];
    const nextRun = nextRuns[i];

    if (!prevRun && nextRun) {
      changes.push(`Run ${i + 1}: Added ${getShortModelName(nextRun.model)}${nextRun.reasoningEffort ? ` (${nextRun.reasoningEffort})` : ''}`);
    } else if (prevRun && !nextRun) {
      changes.push(`Run ${i + 1}: Removed ${getShortModelName(prevRun.model)}`);
    } else if (prevRun && nextRun) {
      if (prevRun.model !== nextRun.model) {
        changes.push(`Run ${i + 1} model: ${getShortModelName(prevRun.model)} → ${getShortModelName(nextRun.model)}`);
      }
      if (prevRun.reasoningEffort !== nextRun.reasoningEffort) {
        changes.push(`Run ${i + 1} reasoning: ${prevRun.reasoningEffort ?? 'none'} → ${nextRun.reasoningEffort ?? 'none'}`);
      }
    }
  }

  // Check outlier threshold
  if (prev.grading.outlierThresholdPercent !== next.grading.outlierThresholdPercent) {
    changes.push(`Outlier threshold: ${prev.grading.outlierThresholdPercent}% → ${next.grading.outlierThresholdPercent}%`);
  }

  // Check max tokens
  if (prev.grading.maxTokens !== next.grading.maxTokens) {
    changes.push(`Max tokens: ${prev.grading.maxTokens ?? 'default'} → ${next.grading.maxTokens ?? 'default'}`);
  }

  // Check title generation model
  if (prev.titleGeneration.model !== next.titleGeneration.model) {
    changes.push(`Title model: ${getShortModelName(prev.titleGeneration.model)} → ${getShortModelName(next.titleGeneration.model)}`);
  }

  return changes;
}

// Human-readable descriptions for changes
function getChangeDescription(entry: {
  action: AuditAction;
  changes: {
    field: string;
    previousValue?: unknown;
    newValue?: unknown;
  };
  metadata?: {
    targetEmail?: string;
  };
}): string | string[] {
  const { action, changes, metadata } = entry;

  switch (action) {
    case 'pricing_update':
    case 'signup_bonus_update':
      return `Changed ${changes.field} from ${changes.previousValue} to ${changes.newValue}`;
    case 'admin_email_added':
      return `Added ${metadata?.targetEmail ?? 'unknown'} to admin allowlist`;
    case 'admin_email_removed':
      return `Removed ${metadata?.targetEmail ?? 'unknown'} from admin allowlist`;
    case 'ai_config_update': {
      const prev = changes.previousValue as AiConfig | undefined;
      const next = changes.newValue as AiConfig | undefined;
      if (prev && next) {
        const aiChanges = getAiConfigChanges(prev, next);
        return aiChanges.length > 0 ? aiChanges : ['Updated AI configuration'];
      }
      return 'Updated AI configuration';
    }
    default:
      return `Updated ${changes.field}`;
  }
}

export default function AdminAuditPage() {
  const [actionFilter, setActionFilter] = useState<FilterValue>('all');

  const { auditLog, isLoading } = useAdminAuditLog({
    action: actionFilter === 'all' ? undefined : actionFilter,
    limit: 100,
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (type: string) => {
    const style = getAuditActionStyle(type);
    const Icon = style.icon;
    return <Icon className={cn('size-4', style.text)} />;
  };

  return (
    <PageTransition>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              <h1 className="text-2xl font-bold">Audit Log</h1>
            </div>
            <p className="text-muted-foreground">
              Track all administrative settings changes
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select
              value={actionFilter}
              onValueChange={v => setActionFilter(v as FilterValue)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Changes</SelectItem>
                <SelectItem value="pricing_update">Pricing</SelectItem>
                <SelectItem value="signup_bonus_update">Signup Bonus</SelectItem>
                <SelectItem value="admin_email_added">Admin Added</SelectItem>
                <SelectItem value="admin_email_removed">Admin Removed</SelectItem>
                <SelectItem value="ai_config_update">AI Config</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Audit Log List */}
      <motion.div
        className="rounded-xl border bg-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {isLoading
          ? (
              <div className="divide-y">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            )
          : auditLog.length === 0
            ? (
                <div className="py-16 text-center">
                  <ClipboardList className="mx-auto size-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    No audit entries found
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    Changes to settings will appear here
                  </p>
                </div>
              )
            : (
                <motion.div
                  className="divide-y"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {auditLog.map(entry => (
                    <motion.div
                      key={entry._id}
                      className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                      variants={staggerItem}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-full',
                          getAuditActionStyle(entry.action).bg,
                        )}
                        >
                          {getActionIcon(entry.action)}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs',
                                getAuditActionStyle(entry.action).bg,
                                getAuditActionStyle(entry.action).text,
                              )}
                            >
                              {actionLabels[entry.action]}
                            </Badge>
                          </div>
                          {(() => {
                            const description = getChangeDescription(entry);
                            if (Array.isArray(description)) {
                              return (
                                <ul className="mt-1 space-y-0.5 text-sm text-foreground">
                                  {description.map((line, i) => (
                                    <li key={i} className="font-mono text-xs">
                                      {line}
                                    </li>
                                  ))}
                                </ul>
                              );
                            }
                            return (
                              <p className="mt-1 text-sm text-foreground">
                                {description}
                              </p>
                            );
                          })()}
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            by
                            {' '}
                            {entry.performedByEmail}
                          </p>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
      </motion.div>

      {/* Results count */}
      {!isLoading && auditLog.length > 0 && (
        <motion.p
          className="mt-4 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {auditLog.length}
          {' '}
          {auditLog.length === 1 ? 'entry' : 'entries'}
          {actionFilter !== 'all' && ` (${actionLabels[actionFilter]})`}
        </motion.p>
      )}
    </PageTransition>
  );
}
