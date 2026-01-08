'use client';

import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, ArrowRight, Coins, Loader2, Send, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { SaveIndicator } from '@/components/SaveIndicator';
import { StepIndicator } from '@/components/StepIndicator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AssignmentBriefTab } from '@/features/essays/AssignmentBriefTab';
import { DevSampleLoader } from '@/features/essays/DevSampleLoader';
import { EssayContentTab } from '@/features/essays/EssayContentTab';
import { FocusAreasTab } from '@/features/essays/FocusAreasTab';
import { useAutosave } from '@/hooks/useAutosave';
import { useCredits } from '@/hooks/useCredits';
import { useProfile } from '@/hooks/useProfile';

import { api } from '../../../convex/_generated/api';
import type { AcademicLevel, AssignmentBrief, Rubric } from '../../../convex/schema';

export type DraftData = {
  assignmentBrief: Partial<AssignmentBrief> | null;
  rubric: Partial<Rubric> | null;
  content: string | null;
  focusAreas: string[] | null;
};

const STEPS = [
  { id: 'brief', label: 'Assignment', icon: 'brief' as const },
  { id: 'focus', label: 'Focus Areas', icon: 'focus' as const },
  { id: 'content', label: 'Essay', icon: 'content' as const },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

export function SubmitForm() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const { credits } = useCredits();
  const { profile } = useProfile();

  const [activeTab, setActiveTab] = useState('brief');
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Convex mutations
  const saveDraft = useMutation(api.essays.saveDraft);
  const submitEssay = useMutation(api.essays.submit);

  // Load existing draft from Convex
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

  // Sync draft from Convex when it loads, pre-filling academic level from profile if not set
  useEffect(() => {
    if (existingDraft) {
      const draftAcademicLevel = existingDraft.assignmentBrief?.academicLevel;
      const profileAcademicLevel = profile?.academicLevel;

      setDraft({
        assignmentBrief: {
          ...existingDraft.assignmentBrief,
          // Pre-fill from profile if draft doesn't have an academic level set
          academicLevel: draftAcademicLevel ?? profileAcademicLevel,
        },
        rubric: existingDraft.rubric ?? null,
        content: existingDraft.content ?? null,
        focusAreas: existingDraft.focusAreas ?? null,
      });
    } else if (profile?.academicLevel) {
      // No draft exists yet, but we have a profile academic level - pre-fill it
      setDraft(prev => ({
        ...prev,
        assignmentBrief: {
          ...prev.assignmentBrief,
          academicLevel: profile.academicLevel,
        },
      }));
    }
  }, [existingDraft, profile?.academicLevel]);

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

  // Autosave hook
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

  // Navigation
  const goToStep = (stepId: string) => {
    const currentIndex = STEPS.findIndex(s => s.id === activeTab);
    const nextIndex = STEPS.findIndex(s => s.id === stepId);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(stepId);
  };

  const goNext = () => {
    const currentIndex = STEPS.findIndex(s => s.id === activeTab);
    if (currentIndex < STEPS.length - 1) {
      setDirection(1);
      setActiveTab(STEPS[currentIndex + 1]!.id);
    }
  };

  const goBack = () => {
    const currentIndex = STEPS.findIndex(s => s.id === activeTab);
    if (currentIndex > 0) {
      setDirection(-1);
      setActiveTab(STEPS[currentIndex - 1]!.id);
    }
  };

  // Word count calculation
  const wordCount
    = draft.content?.trim().split(/\s+/).filter(Boolean).length ?? 0;

  // Step validation
  const isBriefComplete = Boolean(
    draft.assignmentBrief?.title
    && draft.assignmentBrief?.instructions
    && draft.assignmentBrief?.subject,
  );

  const isContentComplete = Boolean(
    draft.content && wordCount >= 50 && wordCount <= 50000,
  );

  const completedSteps = [
    ...(isBriefComplete ? ['brief'] : []),
    'focus', // Focus areas are optional, always "complete"
    ...(isContentComplete ? ['content'] : []),
  ];

  const isValid = isBriefComplete && isContentComplete;
  const availableCredits = Number.parseFloat(credits?.available ?? '0');
  const gradingCost = Number.parseFloat(credits?.gradingCost ?? '1');
  const hasEnoughCredits = availableCredits >= gradingCost;

  // Submit handler
  const handleSubmit = async () => {
    if (!isValid || !hasEnoughCredits) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Save before submitting
      try {
        await saveDraft(transformDraftForSave(draft));
      } catch (saveErr) {
        throw new Error(
          `Failed to save draft: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`,
        );
      }

      const result = await submitEssay({});
      router.push(`/grades/${result.gradeId}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit essay',
      );
      setIsSubmitting(false);
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === activeTab);

  return (
    <div className="flex flex-col">
      {/* Dev Tools */}
      <DevSampleLoader onLoad={handleLoadSample} />

      {/* Step Indicator */}
      <div className="mb-8 border-b pb-6">
        <StepIndicator
          steps={STEPS}
          currentStep={activeTab}
          completedSteps={completedSteps}
          onStepClick={goToStep}
        />
      </div>

      {/* Save Status */}
      <div className="mb-6 flex justify-end">
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Tab Content with animations */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          {activeTab === 'brief' && (
            <motion.div
              key="brief"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
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
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
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
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <EssayContentTab
                content={draft.content ?? ''}
                wordCount={wordCount}
                onUpdate={updateContent}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Alert */}
      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Credits Warning */}
      {activeTab === 'content' && !hasEnoughCredits && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              You need
              {' '}
              {credits?.gradingCost ?? '...'}
              {' '}
              credits to submit. You have
              {' '}
              {credits?.available ?? '0.00'}
              {' '}
              credits available.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Navigation Footer */}
      <motion.div
        className="mt-8 flex items-center justify-between border-t pt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Back button */}
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStepIndex === 0}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {activeTab === 'content'
            ? (
                <>
                  {/* Cost indicator */}
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm">
                    <Coins className="size-4 text-primary" />
                    <span className="font-medium">
                      {credits?.gradingCost ?? '...'}
                      {' '}
                      credit
                    </span>
                  </div>

                  {/* Submit button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!isValid || !hasEnoughCredits || isSubmitting}
                    className="btn-lift gap-2 px-6 shadow-purple hover:shadow-purple-md"
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
                </>
              )
            : (
                <Button onClick={goNext} className="gap-2">
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              )}
        </div>
      </motion.div>
    </div>
  );
}
