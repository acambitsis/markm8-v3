'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, FileText, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ScaleIn, SlideIn, StaggerContainer } from '@/components/motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GradeResults } from '@/features/grading/GradeResults';
import { useGradeStatus } from '@/hooks/useGradeStatus';
import { cn } from '@/utils/Helpers';

import type { Id } from '../../../convex/_generated/dataModel';

type Props = {
  gradeId: Id<'grades'>;
};

// Processing steps for visual feedback
const processingSteps = [
  { id: 'structure', label: 'Analyzing essay structure', duration: 2000 },
  { id: 'content', label: 'Evaluating content quality', duration: 3000 },
  { id: 'language', label: 'Checking language and style', duration: 2500 },
  { id: 'scoring', label: 'Running AI evaluation', duration: 4000 },
  { id: 'compiling', label: 'Compiling feedback', duration: 1500 },
];

export function GradeStatusDisplay({ gradeId }: Props) {
  const { grade, isLoading, isError } = useGradeStatus(gradeId);
  const [currentStep, setCurrentStep] = useState(0);
  const [showGrade, setShowGrade] = useState(false);

  // Simulate processing steps animation
  useEffect(() => {
    if (grade?.status === 'processing') {
      const timer = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % processingSteps.length);
      }, 2500);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [grade?.status]);

  // Trigger grade reveal animation
  useEffect(() => {
    if (grade?.status === 'complete') {
      const timer = setTimeout(() => setShowGrade(true), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [grade?.status]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="size-16 rounded-full border-4 border-muted" />
            <motion.div
              className="absolute inset-0 size-16 rounded-full border-4 border-primary border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
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
      <Card className="overflow-hidden">
        <CardContent className="py-16 text-center">
          <SlideIn direction="up">
            <div className="relative mx-auto mb-6 size-20">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/10">
                <FileText className="size-8 text-primary" />
              </div>
            </div>

            <h3 className="text-xl font-semibold">Your essay is in the queue</h3>
            <p className="mt-2 text-muted-foreground">
              We'll start grading "
              {essayTitle}
              " shortly
            </p>

            <div className="mx-auto mt-8 max-w-xs">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-primary/50"
                  initial={{ width: '0%' }}
                  animate={{ width: '15%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Preparing to grade...</p>
            </div>
          </SlideIn>
        </CardContent>
      </Card>
    );
  }

  // Processing Status
  if (status === 'processing') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="py-16">
          <div className="text-center">
            <SlideIn direction="up">
              <div className="relative mx-auto mb-6 size-20">
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80">
                  <Sparkles className="size-8 text-white" />
                </div>
              </div>

              <h3 className="text-xl font-semibold">Grading in progress</h3>
              <p className="mt-2 text-muted-foreground">
                Running multi-model AI evaluation
              </p>
            </SlideIn>
          </div>

          {/* Processing Steps */}
          <div className="mx-auto mt-10 max-w-sm space-y-3">
            {processingSteps.map((step, index) => {
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg p-3 transition-colors',
                    isCurrent && 'bg-primary/5',
                  )}
                >
                  <div className="flex size-6 shrink-0 items-center justify-center">
                    {isComplete
                      ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                          >
                            <CheckCircle2 className="size-5 text-success" />
                          </motion.div>
                        )
                      : isCurrent
                        ? (
                            <Loader2 className="size-5 animate-spin text-primary" />
                          )
                        : (
                            <div className="size-2 rounded-full bg-muted-foreground/30" />
                          )}
                  </div>
                  <span
                    className={cn(
                      'text-sm',
                      isComplete && 'text-muted-foreground',
                      isCurrent && 'font-medium text-foreground',
                      !isComplete && !isCurrent && 'text-muted-foreground/50',
                    )}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mx-auto mt-8 max-w-sm">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '20%' }}
                animate={{ width: `${20 + (currentStep / processingSteps.length) * 60}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Failed Status
  if (status === 'failed') {
    return (
      <SlideIn direction="up">
        <Card className="border-destructive/50">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="size-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold">Grading Failed</h3>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              {grade.errorMessage || 'We encountered an error while grading your essay. You were not charged.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/history">View History</Link>
              </Button>
              <Button asChild>
                <Link href="/submit">
                  <RefreshCw className="mr-2 size-4" />
                  Try Again
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </SlideIn>
    );
  }

  // Complete Status - The hero moment!
  if (status === 'complete' && grade.feedback) {
    return (
      <div className="space-y-6">
        {/* Grade Reveal Card */}
        <ScaleIn delay={0.1}>
          <Card className="relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

            <CardContent className="relative py-10">
              <div className="flex flex-col items-center text-center">
                {/* Grade Circle */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={showGrade ? { scale: 1, rotate: 0 } : {}}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="relative"
                >
                  <div className="flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={showGrade ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.5 }}
                      className="text-4xl font-bold text-white"
                    >
                      {grade.letterGradeRange}
                    </motion.span>
                  </div>

                  {/* Celebration ring */}
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={showGrade ? { scale: 1.5, opacity: 0 } : {}}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="absolute inset-0 rounded-full border-4 border-primary"
                  />
                </motion.div>

                {/* Percentage */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={showGrade ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6 }}
                  className="mt-4"
                >
                  {grade.percentageRange && (
                    <span className="text-lg text-muted-foreground">
                      {grade.percentageRange.lower}
                      –
                      {grade.percentageRange.upper}
                      %
                    </span>
                  )}
                </motion.div>

                {/* Essay Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={showGrade ? { opacity: 1 } : {}}
                  transition={{ delay: 0.7 }}
                  className="mt-6 flex items-center gap-4 text-sm text-muted-foreground"
                >
                  <span>{essayTitle}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span>
                    {essay?.wordCount?.toLocaleString()}
                    {' '}
                    words
                  </span>
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={showGrade ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8 }}
                  className="mt-6 flex gap-3"
                >
                  <Button variant="outline" asChild>
                    <Link href="/history">View History</Link>
                  </Button>
                  <Button asChild className="group">
                    <Link href="/submit">
                      Submit Another
                      <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </ScaleIn>

        {/* Grade Results - Staggered reveal */}
        <StaggerContainer delay={0.8} staggerDelay={0.15}>
          {grade.letterGradeRange && grade.percentageRange && grade.feedback && grade.modelResults && (
            <GradeResults
              letterGradeRange={grade.letterGradeRange}
              percentageRange={grade.percentageRange}
              feedback={grade.feedback}
              modelResults={grade.modelResults}
            />
          )}
        </StaggerContainer>
      </div>
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
