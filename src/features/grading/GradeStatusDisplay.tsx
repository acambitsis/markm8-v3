'use client';

import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GradeResults } from '@/features/grading/GradeResults';
import { useGradeStatus } from '@/hooks/useGradeStatus';

import type { AssignmentBrief, GradeFeedback, ModelResult, PercentageRange } from '../../../convex/schema';

type Props = {
  gradeId: string;
};

export function GradeStatusDisplay({ gradeId }: Props) {
  const { grade, isLoading, isError } = useGradeStatus(gradeId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
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
  const essayTitle = (essay?.assignmentBrief as AssignmentBrief | null)?.title ?? 'Your Essay';

  // Queued Status
  if (status === 'queued') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="mx-auto size-12 animate-spin text-primary" />
          <h3 className="mt-4 text-lg font-semibold">Your essay is in the queue</h3>
          <p className="mt-2 text-muted-foreground">
            We'll start grading "
            {essayTitle}
            " soon.
          </p>
          <Progress value={10} className="mx-auto mt-6 max-w-xs" />
        </CardContent>
      </Card>
    );
  }

  // Processing Status
  if (status === 'processing') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="mx-auto size-12 animate-spin text-primary" />
          <h3 className="mt-4 text-lg font-semibold">Grading in progress</h3>
          <p className="mt-2 text-muted-foreground">
            Running multi-model evaluation on "
            {essayTitle}
            "...
          </p>
          <Progress value={50} className="mx-auto mt-6 max-w-xs" />
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <CheckCircle2 className="size-4 text-green-600" />
              Checking essay structure
            </p>
            <p className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Running AI evaluation
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Failed Status
  if (status === 'failed') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Grading Failed</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>
            {grade.errorMessage || 'We encountered an error while grading your essay. You were not charged.'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/submit">
                <RefreshCw className="mr-2 size-4" />
                Try Again
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Complete Status
  if (status === 'complete' && grade.feedback) {
    return (
      <div className="space-y-6">
        {/* Essay Info */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{essayTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  {essay?.wordCount?.toLocaleString()}
                  {' '}
                  words
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/submit">Submit Another</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade Results */}
        <GradeResults
          letterGradeRange={grade.letterGradeRange!}
          percentageRange={grade.percentageRange as PercentageRange}
          feedback={grade.feedback as GradeFeedback}
          modelResults={grade.modelResults as ModelResult[]}
        />
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
