'use client';

import type { Id } from 'convex/_generated/dataModel';
import { BookOpen, Calendar, FileText, GraduationCap, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { GradeResults } from '@/features/grading/GradeResults';
import { useAdminGradeForQA } from '@/hooks/useAdmin';

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader className="pb-4">
          <SheetTitle>Grade Review</SheetTitle>
          <SheetDescription>
            QA review of grade feedback (essay content not shown)
          </SheetDescription>
        </SheetHeader>

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
          <div className="space-y-6">
            {/* Essay Metadata Card */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <h3 className="mb-3 font-medium">Essay Information</h3>
              <div className="grid gap-3 text-sm">
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
                    <FileText className="size-4 text-muted-foreground" />
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
      </SheetContent>
    </Sheet>
  );
}
