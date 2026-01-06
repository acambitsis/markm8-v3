'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, FileText, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { PageTransition } from '@/components/motion/PageTransition';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GradeResultsV2 } from '@/features/grading/GradeResultsV2';
import { useGradeStatus } from '@/hooks/useGradeStatus';

import type { Id } from '../../../convex/_generated/dataModel';

type Props = {
  gradeId: Id<'grades'>;
};

// Processing step animation
function ProcessingStep({ label, status }: { label: string; status: 'complete' | 'active' | 'pending' }) {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {status === 'complete' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <CheckCircle2 className="size-5 text-green-500" />
        </motion.div>
      )}
      {status === 'active' && (
        <div className="relative">
          <Loader2 className="size-5 animate-spin text-primary" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1.5, opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
          />
        </div>
      )}
      {status === 'pending' && (
        <div className="size-5 rounded-full border-2 border-muted-foreground/30" />
      )}
      <span className={status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}>
        {label}
      </span>
    </motion.div>
  );
}

export function GradeStatusDisplayV2({ gradeId }: Props) {
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

  // Queued Status
  if (status === 'queued') {
    return (
      <PageTransition>
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="mx-auto max-w-md text-center">
              {/* Animated icon */}
              <motion.div
                className="relative mx-auto mb-6 flex size-20 items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Pulsing rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/20"
                  animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 0.3 }}
                />
                {/* Icon */}
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="size-8 text-primary" />
                </div>
              </motion.div>

              <motion.h3
                className="text-xl font-semibold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Essay Queued
              </motion.h3>
              <motion.p
                className="mt-2 text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                &ldquo;
                {essayTitle}
                &rdquo; is in the queue and will be graded shortly.
              </motion.p>

              {/* Progress bar */}
              <motion.div
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Progress value={10} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">Waiting to start...</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  // Processing Status
  if (status === 'processing') {
    return (
      <PageTransition>
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16">
            <div className="mx-auto max-w-md text-center">
              {/* Animated icon */}
              <motion.div
                className="relative mx-auto mb-6 flex size-20 items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Spinning gradient ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-purple-400 to-primary"
                  style={{ padding: '3px' }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                >
                  <div className="size-full rounded-full bg-card" />
                </motion.div>
                {/* Icon */}
                <Sparkles className="size-8 text-primary" />
              </motion.div>

              <motion.h3
                className="text-xl font-semibold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Grading in Progress
              </motion.h3>
              <motion.p
                className="mt-2 text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Multiple AI models are analyzing your essay...
              </motion.p>

              {/* Processing steps */}
              <motion.div
                className="mt-8 space-y-3 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <ProcessingStep label="Analyzing essay structure" status="complete" />
                <ProcessingStep label="Evaluating argument quality" status="active" />
                <ProcessingStep label="Checking grammar & style" status="pending" />
                <ProcessingStep label="Generating feedback" status="pending" />
              </motion.div>

              {/* Progress bar */}
              <motion.div
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Progress value={50} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  This usually takes 30-60 seconds
                </p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </PageTransition>
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
            <GradeResultsV2
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
