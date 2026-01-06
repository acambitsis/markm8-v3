'use client';

import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Coins, Loader2, Send, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AssignmentBriefTab } from '@/features/essays/AssignmentBriefTab';
import { DevSampleLoader } from '@/features/essays/DevSampleLoader';
import { EssayContentTab } from '@/features/essays/EssayContentTab';
import { FocusAreasTab } from '@/features/essays/FocusAreasTab';
import { useAutosave } from '@/hooks/useAutosave';
import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/utils/Helpers';

import { api } from '../../../convex/_generated/api';
import type { AcademicLevel, AssignmentBrief, Rubric } from '../../../convex/schema';

export type DraftData = {
  assignmentBrief: Partial<AssignmentBrief> | null;
  rubric: Partial<Rubric> | null;
  content: string | null;
  focusAreas: string[] | null;
};

export function SubmitForm() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const { credits } = useCredits();

  const [activeTab, setActiveTab] = useState('brief');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Convex mutations
  const saveDraft = useMutation(api.essays.saveDraft);
  const submitEssay = useMutation(api.essays.submit);

  // Load existing draft from Convex (skip until authenticated)
  const existingDraft = useQuery(
    api.essays.getDraft,
    isAuthenticated ? {} : 'skip',
  );

  // Form state
  const [draft, setDraft] = useState<DraftData>({
    assignmentBrief: null,
    rubric: null,
    content: null,
    focusAreas: null,
  });

  // Sync draft from Convex when it loads
  useEffect(() => {
    if (existingDraft) {
      setDraft({
        assignmentBrief: existingDraft.assignmentBrief ?? null,
        rubric: existingDraft.rubric ?? null,
        content: existingDraft.content ?? null,
        focusAreas: existingDraft.focusAreas ?? null,
      });
    }
  }, [existingDraft]);

  // Helper: Transform draft data to saveDraft format
  const transformDraftForSave = useCallback((data: DraftData) => {
    return {
      assignmentBrief: data.assignmentBrief
        ? {
            title: data.assignmentBrief.title ?? undefined,
            instructions: data.assignmentBrief.instructions ?? undefined,
            subject: data.assignmentBrief.subject ?? undefined,
            academicLevel: data.assignmentBrief.academicLevel as AcademicLevel,
          }
        : undefined,
      rubric: data.rubric
        ? {
            customCriteria: data.rubric.customCriteria ?? undefined,
            focusAreas: data.rubric.focusAreas ?? undefined,
          }
        : undefined,
      content: data.content ?? undefined,
      focusAreas: data.focusAreas ?? undefined,
    };
  }, []);

  // Autosave hook - now uses Convex mutation
  const { status: saveStatus } = useAutosave({
    data: draft,
    onSave: async (data) => {
      await saveDraft(transformDraftForSave(data));
    },
  });

  // Update handlers
  const updateAssignmentBrief = useCallback(
    (updates: Partial<AssignmentBrief>) => {
      setDraft(prev => ({
        ...prev,
        assignmentBrief: { ...prev.assignmentBrief, ...updates },
      }));
    },
    [],
  );

  const updateRubric = useCallback((updates: Partial<Rubric>) => {
    setDraft(prev => ({
      ...prev,
      rubric: { ...prev.rubric, ...updates },
    }));
  }, []);

  const updateContent = useCallback((content: string) => {
    setDraft(prev => ({ ...prev, content }));
  }, []);

  const updateFocusAreas = useCallback((focusAreas: string[]) => {
    setDraft(prev => ({ ...prev, focusAreas }));
  }, []);

  // Handler for loading sample essays (dev only)
  const handleLoadSample = useCallback(
    (data: {
      assignmentBrief: Partial<AssignmentBrief>;
      rubric: Partial<Rubric>;
      content: string;
      focusAreas: string[];
    }) => {
      setDraft({
        assignmentBrief: data.assignmentBrief,
        rubric: data.rubric,
        content: data.content,
        focusAreas: data.focusAreas,
      });
    },
    [],
  );

  // Word count calculation
  const wordCount
    = draft.content?.trim().split(/\s+/).filter(Boolean).length ?? 0;

  // Validation
  const isValid = Boolean(
    draft.assignmentBrief?.title
    && draft.assignmentBrief?.instructions
    && draft.assignmentBrief?.subject
    && draft.content
    && wordCount >= 50
    && wordCount <= 50000,
  );

  const availableCredits = Number.parseFloat(credits?.available ?? '0');
  const hasEnoughCredits = availableCredits >= 1.0;

  // Submit handler - now uses Convex mutation
  const handleSubmit = async () => {
    if (!isValid || !hasEnoughCredits) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Explicitly save before submitting to ensure draft exists
      // Note: This is a pragmatic fix for autosave debounce timing issue.
      // Long-term: Consider making submitEssay accept draft data directly to avoid
      // non-atomic two-mutation pattern.
      try {
        await saveDraft(transformDraftForSave(draft));
      } catch (saveErr) {
        throw new Error(
          `Failed to save draft: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`,
        );
      }

      const result = await submitEssay({});

      // No need to refresh credits - Convex subscription auto-updates!
      // Redirect to grade page
      router.push(`/grades/${result.gradeId}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit essay',
      );
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 'brief', label: 'Assignment', description: 'Details & requirements' },
    { id: 'focus', label: 'Focus Areas', description: 'What to emphasize' },
    { id: 'content', label: 'Essay', description: 'Your writing' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === activeTab);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0,
    }),
  };

  const goToStep = (stepId: string) => {
    setActiveTab(stepId);
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setActiveTab(steps[nextIndex]!.id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setActiveTab(steps[prevIndex]!.id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Dev Tools - Only renders in development */}
      <DevSampleLoader onLoad={handleLoadSample} />

      {/* Step Indicator */}
      <div className="relative">
        {/* Step circles with connecting lines */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isClickable = index <= currentStepIndex;

            return (
              <div key={step.id} className="flex flex-1 items-center">
                {/* Connector line (before) */}
                {index > 0 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 transition-colors duration-300',
                      isCompleted || isCurrent ? 'bg-primary' : 'bg-border',
                    )}
                  />
                )}

                {/* Step circle */}
                <button
                  type="button"
                  onClick={() => isClickable && goToStep(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full',
                    'text-sm font-medium transition-all duration-300',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isCompleted && [
                      'bg-primary text-primary-foreground',
                      'hover:bg-primary/90 cursor-pointer',
                    ],
                    isCurrent && [
                      'bg-primary text-primary-foreground shadow-lg shadow-primary/25',
                      'ring-4 ring-primary/20',
                    ],
                    !isCompleted && !isCurrent && [
                      'bg-muted text-muted-foreground border-2 border-border',
                    ],
                    !isClickable && 'cursor-default',
                  )}
                >
                  {isCompleted
                    ? (
                        <CheckCircle2 className="size-5" />
                      )
                    : (
                        <span>{index + 1}</span>
                      )}
                </button>

                {/* Connector line (after) */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 transition-colors duration-300',
                      isCompleted ? 'bg-primary' : 'bg-border',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step labels */}
        <div className="mt-3 flex justify-between">
          {steps.map((step, index) => {
            const isCurrent = index === currentStepIndex;
            return (
              <div
                key={step.id}
                className={cn(
                  'flex-1 text-center transition-colors duration-300',
                  index === 0 && 'text-left',
                  index === steps.length - 1 && 'text-right',
                )}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="mt-0.5 block text-xs text-muted-foreground/60">
                    {step.description}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Saving draft...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="size-3.5" />
              Draft saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-destructive">
              <AlertCircle className="size-3.5" />
              Save failed
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Coins className="size-3.5 text-amber-500" />
          <span>Cost: 1.00 credit</span>
        </div>
      </div>

      {/* Step Content with Animation */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait" custom={currentStepIndex}>
          {activeTab === 'brief' && (
            <motion.div
              key="brief"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <AssignmentBriefTab
                assignmentBrief={draft.assignmentBrief}
                rubric={draft.rubric}
                onUpdateBrief={updateAssignmentBrief}
                onUpdateRubric={updateRubric}
              />
            </motion.div>
          )}

          {activeTab === 'focus' && (
            <motion.div
              key="focus"
              custom={currentStepIndex}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <FocusAreasTab
                focusAreas={draft.focusAreas ?? []}
                onUpdate={updateFocusAreas}
              />
            </motion.div>
          )}

          {activeTab === 'content' && (
            <motion.div
              key="content"
              custom={currentStepIndex}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <EssayContentTab
                content={draft.content ?? ''}
                wordCount={wordCount}
                onUpdate={updateContent}
              />

              {/* Error Alert */}
              {submitError && (
                <Alert variant="destructive" className="mt-6">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {/* Credits Warning */}
              {!hasEnoughCredits && (
                <Alert variant="destructive" className="mt-6">
                  <AlertCircle className="size-4" />
                  <AlertDescription>
                    You need 1.00 credits to submit. You have
                    {' '}
                    {credits?.available ?? '0.00'}
                    {' '}
                    credits available.
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button
          variant="ghost"
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className={cn(
            'gap-2',
            currentStepIndex === 0 && 'invisible',
          )}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {currentStepIndex < steps.length - 1
          ? (
              <Button onClick={nextStep} className="gap-2">
                Continue
                <ArrowRight className="size-4" />
              </Button>
            )
          : (
              <Button
                onClick={handleSubmit}
                disabled={!isValid || !hasEnoughCredits || isSubmitting}
                className="gap-2"
                size="lg"
              >
                {isSubmitting
                  ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting...
                      </>
                    )
                  : (
                      <>
                        <Sparkles className="size-4" />
                        Submit for Grading
                        <Send className="size-4" />
                      </>
                    )}
              </Button>
            )}
      </div>
    </div>
  );
}
