'use client';

import { useAction } from 'convex/react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, FileText, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { PageTransition } from '@/components/motion/PageTransition';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGradeStatus } from '@/hooks/useGradeStatus';
import { calculateEssayStats } from '@/utils/essayStats';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { TopicInsights } from '../../../convex/schema';
import { InsightCarousel, MatrixRain } from './components';
import { GradeResults } from './GradeResults';

type Props = {
  gradeId: Id<'grades'>;
};

export function GradeStatusDisplay({ gradeId }: Props) {
  const { grade, isLoading, isError } = useGradeStatus(gradeId);

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
          {grade.letterGradeRange && grade.percentageRange && grade.feedback && grade.modelResults && (
            <GradeResults
              letterGradeRange={grade.letterGradeRange}
              percentageRange={grade.percentageRange}
              feedback={grade.feedback}
              modelResults={grade.modelResults}
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

type ProcessingExperienceProps = {
  gradeId: Id<'grades'>;
  essayTitle: string;
  essayContent?: string;
  essaySubject?: string;
};

function ProcessingExperience({
  gradeId,
  essayTitle,
  essayContent,
  essaySubject,
}: ProcessingExperienceProps) {
  // Topic insights state (fetched via action, not persisted)
  const [topicInsights, setTopicInsights] = useState<TopicInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const generateTopicInsights = useAction(api.topicInsights.generate);

  // Fetch topic insights on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchInsights() {
      setInsightsLoading(true);
      try {
        const insights = await generateTopicInsights({ gradeId });
        if (!cancelled) {
          setTopicInsights(insights);
        }
      } catch {
        // Silent failure - topic insights are non-critical
      } finally {
        if (!cancelled) {
          setInsightsLoading(false);
        }
      }
    }

    fetchInsights();

    return () => {
      cancelled = true;
    };
  }, [gradeId, generateTopicInsights]);

  // Calculate essay stats client-side
  const essayStats = useMemo(() => {
    if (!essayContent) {
      return null;
    }
    return calculateEssayStats(essayContent);
  }, [essayContent]);

  const subject = essaySubject ?? 'General';
  const hasTopicInsights = topicInsights !== null && !insightsLoading;

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
              >
                Grading Your Essay
              </motion.h3>
              <motion.p
                className="mt-1 text-sm text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                &ldquo;
                {essayTitle}
                &rdquo;
                {subject !== 'General' && (
                  <span className="ml-1">
                    ·
                    {subject}
                  </span>
                )}
              </motion.p>
            </div>

            {/* Matrix animation */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <MatrixRain height={50} />
            </motion.div>

            {/* Unified carousel (stats + tips/insights) */}
            <InsightCarousel
              essayStats={essayStats}
              topicInsights={topicInsights ?? undefined}
              hasTopicInsights={hasTopicInsights}
            />
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
