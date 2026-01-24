'use client';

import { motion } from 'framer-motion';
import { Check, ChevronDown, GraduationCap, Pencil, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/Helpers';

import type { Id } from '../../../convex/_generated/dataModel';

type Props = {
  essayId: Id<'essays'>;
  actualGrade?: string;
  actualFeedback?: string;
  onSave: (data: { essayId: Id<'essays'>; actualGrade?: string; actualFeedback?: string }) => Promise<void>;
};

export function ActualGradeSection({ essayId, actualGrade, actualFeedback, onSave }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [grade, setGrade] = useState(actualGrade ?? '');
  const [feedback, setFeedback] = useState(actualFeedback ?? '');

  const hasExistingData = Boolean(actualGrade || actualFeedback);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        essayId,
        actualGrade: grade || undefined,
        actualFeedback: feedback || undefined,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setGrade(actualGrade ?? '');
    setFeedback(actualFeedback ?? '');
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setGrade(actualGrade ?? '');
    setFeedback(actualFeedback ?? '');
    setIsEditing(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card
          className={cn(
            'transition-colors',
            !isOpen && 'border-dashed border-muted-foreground/30 bg-muted/20',
            isOpen && 'border-purple-500/50',
          )}
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-lg',
                    isOpen ? 'bg-purple-500/10' : 'bg-muted',
                  )}
                >
                  <GraduationCap
                    className={cn(
                      'size-5',
                      isOpen ? 'text-purple-600' : 'text-muted-foreground',
                    )}
                  />
                </div>
                <div>
                  <span className={cn('font-medium', !isOpen && 'text-muted-foreground')}>
                    Actual Grade Received
                  </span>
                  {hasExistingData && !isOpen && (
                    <p className="text-sm text-muted-foreground">
                      {actualGrade && <span className="font-medium text-purple-600">{actualGrade}</span>}
                      {actualGrade && actualFeedback && ' - '}
                      {actualFeedback && 'Feedback recorded'}
                    </p>
                  )}
                  {!hasExistingData && !isOpen && (
                    <p className="text-sm text-muted-foreground">
                      Record your teacher&apos;s grade for calibration
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'size-5 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="border-t pt-4">
              {!isEditing
                ? (
                    // View mode
                    <div className="space-y-4">
                      {hasExistingData
                        ? (
                            <>
                              <div className="space-y-3">
                                {actualGrade && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Grade</Label>
                                    <p className="mt-1 text-lg font-semibold text-purple-600">{actualGrade}</p>
                                  </div>
                                )}
                                {actualFeedback && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Teacher Feedback</Label>
                                    <p className="mt-1 whitespace-pre-wrap text-sm">{actualFeedback}</p>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleStartEdit}
                                className="gap-2"
                              >
                                <Pencil className="size-3.5" />
                                Edit
                              </Button>
                            </>
                          )
                        : (
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                After receiving your grade from your teacher, record it here to compare with our AI assessment.
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleStartEdit}
                                className="gap-2"
                              >
                                <Pencil className="size-3.5" />
                                Add Actual Grade
                              </Button>
                            </div>
                          )}
                    </div>
                  )
                : (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="actual-grade">Grade</Label>
                        <Input
                          id="actual-grade"
                          placeholder='e.g., "B+", "85%", "7/10"'
                          value={grade}
                          onChange={e => setGrade(e.target.value)}
                          className="max-w-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="actual-feedback">Teacher Feedback (optional)</Label>
                        <Textarea
                          id="actual-feedback"
                          placeholder="Paste or type your teacher's feedback here..."
                          value={feedback}
                          onChange={e => setFeedback(e.target.value)}
                          rows={4}
                          className="resize-y"
                        />
                        <p className="text-xs text-muted-foreground">
                          {feedback.length.toLocaleString()}
                          {' '}
                          / 5,000 characters
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isSaving || (!grade && !feedback)}
                          className="gap-2"
                        >
                          {isSaving
                            ? (
                                <>Saving...</>
                              )
                            : (
                                <>
                                  <Check className="size-3.5" />
                                  Save
                                </>
                              )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="gap-2"
                        >
                          <X className="size-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </motion.div>
  );
}
