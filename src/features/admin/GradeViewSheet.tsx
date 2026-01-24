'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { Id } from 'convex/_generated/dataModel';
import { BookOpen, Calendar, ClipboardList, Coins, FileText, GraduationCap, Hash, Loader2, MessageSquare, Target, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { GradeResults } from '@/features/grading/GradeResults';
import { useAdminGradeForQA } from '@/hooks/useAdmin';
import { formatApiCost, formatTokens } from '@/utils/formatCost';
import { cn } from '@/utils/Helpers';

type Props = {
  gradeId: Id<'grades'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GradeViewSheet({ gradeId, open, onOpenChange }: Props) {
  const { grade, isLoading } = useAdminGradeForQA(gradeId);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) {
      return '-';
    }
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAcademicLevel = (level?: string) => {
    if (!level) {
      return null;
    }
    const labels: Record<string, string> = {
      high_school: 'High School',
      undergraduate: 'Undergraduate',
      postgraduate: 'Postgraduate',
      professional: 'Professional',
    };
    return labels[level] ?? level;
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
            'w-[95vw] max-w-5xl h-[90vh]',
            'flex flex-col rounded-lg border bg-background shadow-lg',
            'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                Grade Review
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                QA review of grade feedback (essay content not shown)
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && !grade && (
              <div className="py-16 text-center">
                <FileText className="mx-auto size-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Grade not found</p>
              </div>
            )}

            {!isLoading && grade && (
              <div className="mx-auto max-w-4xl space-y-6">
                {/* Essay Metadata Card */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <h3 className="mb-3 font-medium">Essay Information</h3>
                  <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Title:</span>
                      <span className="font-medium">{grade.essayMetadata.title}</span>
                    </div>
                    {grade.essayMetadata.subject && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Subject:</span>
                        <Badge variant="secondary">{grade.essayMetadata.subject}</Badge>
                      </div>
                    )}
                    {grade.essayMetadata.academicLevel && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Level:</span>
                        <span>{formatAcademicLevel(grade.essayMetadata.academicLevel)}</span>
                      </div>
                    )}
                    {grade.essayMetadata.wordCount && (
                      <div className="flex items-center gap-2">
                        <Hash className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Word Count:</span>
                        <span>
                          {grade.essayMetadata.wordCount.toLocaleString()}
                          {' '}
                          words
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Submitted:</span>
                      <span>{formatDate(grade.essayMetadata.submittedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Graded:</span>
                      <span>{formatDate(grade.grade.completedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Context Provided Section */}
                {grade.contextProvided && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h3 className="mb-3 font-medium">Context Provided</h3>
                    <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                      {/* Instructions indicator */}
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Instructions:</span>
                        <span>
                          {grade.contextProvided.hasCustomInstructions
                            ? `Custom (${grade.contextProvided.instructionLength} chars)`
                            : 'Default'}
                        </span>
                      </div>
                      {/* Rubric indicator */}
                      <div className="flex items-center gap-2">
                        <ClipboardList className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Custom Rubric:</span>
                        <span>
                          {grade.contextProvided.hasCustomRubric
                            ? `Yes (${grade.contextProvided.rubricLength} chars)`
                            : 'No'}
                        </span>
                      </div>
                      {/* Focus areas */}
                      {grade.contextProvided.focusAreas.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Target className="size-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Focus Areas:</span>
                          <div className="flex flex-wrap gap-1">
                            {grade.contextProvided.focusAreas.map(area => (
                              <Badge key={area} variant="secondary">{area}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* API Cost Section */}
                {(grade.grade.apiCost || grade.grade.totalTokens) && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h3 className="mb-3 font-medium">API Cost</h3>
                    <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Coins className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Total Cost:</span>
                        <span className="font-medium text-green-600">{formatApiCost(grade.grade.apiCost)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Total Tokens:</span>
                        <span>{formatTokens(grade.grade.totalTokens)}</span>
                      </div>
                      {/* Per-run costs */}
                      {grade.grade.modelResults && grade.grade.modelResults.some(r => r.cost) && (
                        <div className="flex w-full flex-wrap items-center gap-2">
                          <span className="text-muted-foreground">Per-run:</span>
                          {grade.grade.modelResults.filter(r => r.cost).map(result => (
                            <Badge key={result.model} variant="outline" className="font-mono text-xs">
                              {result.model.split('/').pop()}
                              :
                              {' '}
                              {formatApiCost(result.cost)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actual Grade Section (user-provided) */}
                {grade.actualGradeData && (
                  <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-medium">
                      <GraduationCap className="size-4 text-purple-600" />
                      Actual Grade Received
                    </h3>
                    <div className="space-y-3 text-sm">
                      {grade.actualGradeData.grade && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Grade:</span>
                          <span className="font-semibold text-purple-600">{grade.actualGradeData.grade}</span>
                        </div>
                      )}
                      {grade.actualGradeData.feedback && (
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                            <MessageSquare className="size-4" />
                            <span>Teacher Feedback:</span>
                          </div>
                          <p className="whitespace-pre-wrap rounded bg-background/50 p-2 text-sm">
                            {grade.actualGradeData.feedback}
                          </p>
                        </div>
                      )}
                      {grade.actualGradeData.addedAt && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="size-3" />
                          <span>
                            Added:
                            {' '}
                            {formatDate(grade.actualGradeData.addedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Grade Results */}
                {grade.grade.percentageRange && grade.grade.feedback && grade.grade.modelResults && (
                  <GradeResults
                    percentageRange={grade.grade.percentageRange}
                    feedback={grade.grade.feedback}
                    modelResults={grade.grade.modelResults}
                  />
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
