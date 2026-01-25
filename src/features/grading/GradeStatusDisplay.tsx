'use client';

import { useAction, useMutation } from 'convex/react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Check, FileText, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PageTransition } from '@/components/motion/PageTransition';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGradeStatus } from '@/hooks/useGradeStatus';
import { calculateEssayStats } from '@/utils/essayStats';
import { cn } from '@/utils/Helpers';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { EssayObservations } from '../../../convex/schema';
import { InsightCarousel, MatrixRain } from './components';
import { GradeResults } from './GradeResults';

type Props = {
  gradeId: Id<'grades'>;
};

export function GradeStatusDisplay({ gradeId }: Props) {
  const { grade, isLoading, isError } = useGradeStatus(gradeId);
  const updateActualGrade = useMutation(api.essays.updateActualGrade);

  const handleSaveActualGrade = useCallback(
    async (data: { essayId: Id<'essays'>; actualGrade?: string; actualFeedback?: string }) => {
      await updateActualGrade(data);
    },
    [updateActualGrade],
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          >
            <Sparkles className="size-10 text-primary" />
          </motion.div>
          <p className="mt-4 text-muted-foreground">Loading grade results...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError || !grade) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load grade results. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  const { status, essay } = grade;
  const essayTitle = essay?.assignmentBrief?.title ?? 'Your Essay';

  // Processing Status - Simplified waiting experience
  if (status === 'processing' || status === 'queued') {
    return (
      <ProcessingExperience
        gradeId={gradeId}
        essayTitle={essayTitle}
        essayContent={essay?.content}
        essaySubject={essay?.assignmentBrief?.subject}
        synthesisStatus={grade.synthesisStatus}
        runProgress={grade.runProgress}
      />
    );
  }

  // Failed Status
  if (status === 'failed') {
    return (
      <PageTransition>
        <Card className="border-0 border-destructive/20 bg-destructive/5 shadow-lg">
          <CardContent className="py-12">
            <div className="mx-auto max-w-md text-center">
              <motion.div
                className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <AlertCircle className="size-8 text-destructive" />
              </motion.div>
              <h3 className="text-xl font-semibold text-destructive">Grading Failed</h3>
              <p className="mt-2 text-muted-foreground">
                {grade.errorMessage || 'We encountered an error while grading your essay. Your credit has been refunded.'}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    Back to Dashboard
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/submit">
                    <RefreshCw className="mr-2 size-4" />
                    Try Again
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  // Complete Status
  if (status === 'complete' && grade.feedback) {
    return (
      <PageTransition>
        <div className="space-y-6">
          {/* Essay Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="size-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold">{essayTitle}</h2>
                      <p className="text-sm text-muted-foreground">
                        {essay?.wordCount?.toLocaleString()}
                        {' '}
                        words
                        {essay?.assignmentBrief?.subject && (
                          <>
                            {' '}
                            ·
                            {' '}
                            {essay.assignmentBrief.subject}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" asChild className="gap-2">
                    <Link href="/submit">
                      Submit Another
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Grade Results */}
          {grade.percentageRange && grade.feedback && grade.modelResults && (
            <GradeResults
              percentageRange={grade.percentageRange}
              feedback={grade.feedback}
              modelResults={grade.modelResults}
              essayId={essay?._id}
              actualGrade={essay?.actualGrade}
              actualFeedback={essay?.actualFeedback}
              onSaveActualGrade={handleSaveActualGrade}
            />
          )}
        </div>
      </PageTransition>
    );
  }

  // Unknown status fallback
  return (
    <Alert>
      <AlertCircle className="size-4" />
      <AlertTitle>Unknown Status</AlertTitle>
      <AlertDescription>
        The grade is in an unexpected state. Please refresh the page.
      </AlertDescription>
    </Alert>
  );
}

// =============================================================================
// Processing Experience Component (Simplified)
// =============================================================================

type SynthesisStatus = 'pending' | 'processing' | 'complete' | 'skipped' | 'failed';
type RunStatus = 'pending' | 'complete' | 'failed';

type RunProgress = {
  model: string;
  status: RunStatus;
  completedAt?: number;
};

type ProcessingExperienceProps = {
  gradeId: Id<'grades'>;
  essayTitle: string;
  essayContent?: string;
  essaySubject?: string;
  synthesisStatus?: SynthesisStatus;
  runProgress?: RunProgress[];
};

function ProcessingExperience({
  gradeId,
  essayTitle,
  essayContent,
  essaySubject,
  synthesisStatus,
  runProgress,
}: ProcessingExperienceProps) {
  // Essay observations state (fetched via action, not persisted)
  const [observations, setObservations] = useState<EssayObservations | null>(null);
  const [observationsLoading, setObservationsLoading] = useState(false);
  const generateObservations = useAction(api.topicInsights.generate);

  // Fetch essay observations on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchObservations() {
      setObservationsLoading(true);
      try {
        const result = await generateObservations({ gradeId });
        if (!cancelled) {
          setObservations(result);
        }
      } catch {
        // Silent failure - observations are non-critical
      } finally {
        if (!cancelled) {
          setObservationsLoading(false);
        }
      }
    }

    fetchObservations();

    return () => {
      cancelled = true;
    };
  }, [gradeId, generateObservations]);

  // Calculate essay stats client-side (for fallback display)
  const essayStats = useMemo(() => {
    if (!essayContent) {
      return null;
    }
    return calculateEssayStats(essayContent);
  }, [essayContent]);

  const subject = essaySubject ?? 'General';
  const hasObservations = observations !== null && !observationsLoading;

  // Derive status info from progress
  const { statusTitle, statusSubtext } = useMemo(() => {
    const completed = runProgress?.filter(r => r.status === 'complete').length ?? 0;
    const total = runProgress?.length ?? 0;
    const allComplete = total > 0 && completed === total;

    if (synthesisStatus === 'processing') {
      return {
        statusTitle: 'Synthesizing Feedback',
        statusSubtext: 'Merging insights from multiple AI graders...',
      };
    }
    if (allComplete) {
      return {
        statusTitle: 'Finalizing Results',
        statusSubtext: `All ${total} grading runs complete`,
      };
    }
    if (total > 0) {
      return {
        statusTitle: 'Grading Your Essay',
        statusSubtext: `Completed ${completed} of ${total} grading runs`,
      };
    }
    return { statusTitle: 'Grading Your Essay', statusSubtext: null };
  }, [runProgress, synthesisStatus]);

  return (
    <PageTransition>
      <Card className="border-0 shadow-lg">
        <CardContent className="py-8">
          <div className="mx-auto max-w-lg">
            {/* Header */}
            <div className="mb-6 text-center">
              <motion.h3
                className="text-lg font-semibold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={statusTitle}
              >
                {statusTitle}
              </motion.h3>
              <motion.p
                className="mt-1 text-sm text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                {statusSubtext ?? (
                  <>
                    &ldquo;
                    {essayTitle}
                    &rdquo;
                    {subject !== 'General' && (
                      <span className="ml-1">
                        ·
                        {subject}
                      </span>
                    )}
                  </>
                )}
              </motion.p>
            </div>

            {/* Progress indicator */}
            <GradingProgressIndicator
              runProgress={runProgress}
              synthesisStatus={synthesisStatus}
            />

            {/* Matrix animation */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <MatrixRain height={50} />
            </motion.div>

            {/* Carousel showing essay understanding */}
            <InsightCarousel
              essayStats={essayStats}
              essayContent={essayContent}
              observations={observations ?? undefined}
              hasObservations={hasObservations}
            />
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}

// =============================================================================
// Grading Progress Indicator Component
// =============================================================================

type GradingProgressIndicatorProps = {
  runProgress?: RunProgress[];
  synthesisStatus?: SynthesisStatus;
};

/**
 * Extract a short, readable model name from a slug
 * e.g., "openai/gpt-5.2" -> "GPT 5.2"
 *       "x-ai/grok-4.1-fast" -> "Grok 4.1"
 */
function getModelShortName(slug: string): string {
  const name = slug.split('/')[1] || slug;
  return name
    .replace(/-preview$/, '')
    .replace(/-pro$/, '')
    .replace(/-fast$/, '')
    .replace(/^gpt-/, 'GPT ')
    .replace(/^gemini-/, 'Gemini ')
    .replace(/^grok-/, 'Grok ')
    .replace(/^claude-/, 'Claude ');
}

/** Shared base classes for status chips */
const STATUS_CHIP_BASE = 'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors';

/** Status color variants */
const STATUS_COLORS = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  muted: 'bg-muted text-muted-foreground',
  active: 'bg-primary/10 text-primary',
} as const;

/** Get status-specific chip classes for model runs */
function getRunStatusClasses(status: RunStatus): string {
  switch (status) {
    case 'complete':
      return STATUS_COLORS.success;
    case 'failed':
      return STATUS_COLORS.error;
    default:
      return STATUS_COLORS.muted;
  }
}

/** Get status-specific chip classes for synthesis (uses warning for failed) */
function getSynthesisStatusClasses(status: SynthesisStatus): string {
  switch (status) {
    case 'complete':
      return STATUS_COLORS.success;
    case 'processing':
      return STATUS_COLORS.active;
    case 'failed':
      return STATUS_COLORS.warning; // Warning, not error - synthesis failure is non-critical
    default:
      return STATUS_COLORS.muted;
  }
}

/** Get the icon for a run status */
function RunStatusIcon({ status }: { status: RunStatus }) {
  switch (status) {
    case 'complete':
      return <Check className="size-3" />;
    case 'failed':
      return <X className="size-3" />;
    default:
      return <Loader2 className="size-3 animate-spin" />;
  }
}

/** Get the icon for a synthesis status */
function SynthesisStatusIcon({ status }: { status: SynthesisStatus }) {
  switch (status) {
    case 'complete':
      return <Check className="size-3" />;
    case 'failed':
      return <AlertCircle className="size-3" />;
    default:
      return <Loader2 className="size-3 animate-spin" />;
  }
}

function GradingProgressIndicator({
  runProgress,
  synthesisStatus,
}: GradingProgressIndicatorProps) {
  if (!runProgress || runProgress.length === 0) {
    return null;
  }

  const allComplete = runProgress.every(r => r.status === 'complete');

  return (
    <motion.div
      className="mb-6 flex flex-wrap items-center justify-center gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      {/* Model chips */}
      {runProgress.map((run, i) => (
        <div
          key={`${run.model}-${i}`}
          className={cn(STATUS_CHIP_BASE, getRunStatusClasses(run.status))}
        >
          <RunStatusIcon status={run.status} />
          <span>{getModelShortName(run.model)}</span>
        </div>
      ))}

      {/* Arrow and synthesis chip when all models complete */}
      {allComplete && synthesisStatus && synthesisStatus !== 'skipped' && (
        <>
          <ArrowRight className="mx-1 size-4 text-muted-foreground" />
          <div className={cn(STATUS_CHIP_BASE, getSynthesisStatusClasses(synthesisStatus))}>
            <SynthesisStatusIcon status={synthesisStatus} />
            <span>Synthesis</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
