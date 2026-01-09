'use client';

import { useAction, useConvexAuth, useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { SaveIndicator } from '@/components/SaveIndicator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnhancementPanel } from '@/features/essays/components/EnhancementPanel';
import { EssayContentInput } from '@/features/essays/components/essay-content-input';
import { FeedbackQualityMeter } from '@/features/essays/components/FeedbackQualityMeter';
import { DevSampleLoader } from '@/features/essays/DevSampleLoader';
import { useAutosave } from '@/hooks/useAutosave';
import { useCredits } from '@/hooks/useCredits';
import { useProfile } from '@/hooks/useProfile';
import { isAcademicLevel } from '@/utils/academicLevel';
import { cn } from '@/utils/Helpers';

import { api } from '../../../convex/_generated/api';
import type { AssignmentBrief, Rubric } from '../../../convex/schema';

// =============================================================================
// Types
// =============================================================================

export type DraftData = {
  assignmentBrief: Partial<AssignmentBrief> | null;
  rubric: Partial<Rubric> | null;
  content: string | null;
  focusAreas: string[] | null;
};

// =============================================================================
// Constants
// =============================================================================

const MIN_WORDS = 50;
const MAX_WORDS = 50000;

// =============================================================================
// Animation Variants
// =============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

// =============================================================================
// Component
// =============================================================================

export function EssaySubmitCanvas() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const { credits } = useCredits();
  const { profile } = useProfile();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [hasGeneratedSuggestions, setHasGeneratedSuggestions] = useState(false);
  const previousContentRef = useRef<string>('');

  // Convex
  const saveDraft = useMutation(api.essays.saveDraft);
  const submitEssay = useMutation(api.essays.submit);
  const generateSuggestions = useAction(api.suggestions.generateSuggestions);

  // Load existing draft
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

  // Sync draft from Convex
  useEffect(() => {
    if (existingDraft) {
      const draftAcademicLevel = existingDraft.assignmentBrief?.academicLevel;
      const profileAcademicLevel = profile?.academicLevel;

      setDraft({
        assignmentBrief: existingDraft.assignmentBrief
          ? {
              ...existingDraft.assignmentBrief,
              academicLevel: draftAcademicLevel ?? profileAcademicLevel,
            }
          : profileAcademicLevel
            ? { academicLevel: profileAcademicLevel }
            : null,
        rubric: existingDraft.rubric ?? null,
        content: existingDraft.content ?? null,
        focusAreas: existingDraft.focusAreas ?? null,
      });

      // If draft has title/subject, mark suggestions as already generated
      if (existingDraft.assignmentBrief?.title || existingDraft.assignmentBrief?.subject) {
        setHasGeneratedSuggestions(true);
      }
    } else if (profile?.academicLevel) {
      setDraft(prev => ({
        ...prev,
        assignmentBrief: prev.assignmentBrief
          ? { ...prev.assignmentBrief, academicLevel: profile.academicLevel }
          : { academicLevel: profile.academicLevel },
      }));
    }
  }, [existingDraft, profile?.academicLevel]);

  // ---------------------------------------------------------------------------
  // Autosave
  // ---------------------------------------------------------------------------

  const transformDraftForSave = useCallback((data: DraftData) => {
    const academicLevel = data.assignmentBrief?.academicLevel;
    const hasTextContent = data.assignmentBrief?.title
      || data.assignmentBrief?.instructions
      || data.assignmentBrief?.subject;

    return {
      assignmentBrief: hasTextContent
        ? {
            title: data.assignmentBrief?.title ?? undefined,
            instructions: data.assignmentBrief?.instructions ?? undefined,
            subject: data.assignmentBrief?.subject ?? undefined,
            academicLevel: isAcademicLevel(academicLevel) ? academicLevel : undefined,
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

  const { status: saveStatus } = useAutosave({
    data: draft,
    onSave: async (data) => {
      await saveDraft(transformDraftForSave(data));
    },
  });

  // ---------------------------------------------------------------------------
  // AI Suggestions
  // ---------------------------------------------------------------------------

  const handleGenerateSuggestions = useCallback(async () => {
    const content = draft.content?.trim();
    if (!content || content.length < 100) {
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const suggestions = await generateSuggestions({ content });

      if (suggestions.title || suggestions.subject) {
        setDraft(prev => ({
          ...prev,
          assignmentBrief: {
            ...prev.assignmentBrief,
            title: suggestions.title || prev.assignmentBrief?.title,
            subject: suggestions.subject || prev.assignmentBrief?.subject,
          },
        }));
        setHasGeneratedSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [draft.content, generateSuggestions]);

  // Auto-generate suggestions when content is pasted/uploaded
  useEffect(() => {
    const content = draft.content?.trim() ?? '';
    const prevContent = previousContentRef.current;

    // Detect significant content change (new paste/upload)
    const contentLengthDiff = Math.abs(content.length - prevContent.length);
    const isSignificantChange = contentLengthDiff > 200;

    // Auto-generate if:
    // 1. Content has significant change
    // 2. Content is long enough
    // 3. We haven't already generated
    // 4. Not currently generating
    if (
      isSignificantChange
      && content.length >= 200
      && !hasGeneratedSuggestions
      && !isGeneratingSuggestions
    ) {
      handleGenerateSuggestions();
    }

    previousContentRef.current = content;
  }, [draft.content, hasGeneratedSuggestions, isGeneratingSuggestions, handleGenerateSuggestions]);

  // ---------------------------------------------------------------------------
  // Update Handlers
  // ---------------------------------------------------------------------------

  const updateContent = useCallback((content: string) => {
    setDraft(prev => ({ ...prev, content }));
  }, []);

  const updateTitle = useCallback((title: string) => {
    setDraft(prev => ({
      ...prev,
      assignmentBrief: { ...prev.assignmentBrief, title },
    }));
  }, []);

  const updateSubject = useCallback((subject: string) => {
    setDraft(prev => ({
      ...prev,
      assignmentBrief: { ...prev.assignmentBrief, subject },
    }));
  }, []);

  const updateInstructions = useCallback((instructions: string) => {
    setDraft(prev => ({
      ...prev,
      assignmentBrief: { ...prev.assignmentBrief, instructions },
    }));
  }, []);

  const updateRubric = useCallback((customCriteria: string) => {
    setDraft(prev => ({
      ...prev,
      rubric: { ...prev.rubric, customCriteria },
    }));
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
      setHasGeneratedSuggestions(true); // Sample has title/subject
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  const wordCount = draft.content?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  const hasContent = wordCount > 0;
  const isContentValid = wordCount >= MIN_WORDS && wordCount <= MAX_WORDS;
  const hasTitle = Boolean(draft.assignmentBrief?.title?.trim());
  const hasSubject = Boolean(draft.assignmentBrief?.subject?.trim());
  const hasInstructions = Boolean(draft.assignmentBrief?.instructions?.trim());
  const hasRubric = Boolean(draft.rubric?.customCriteria?.trim());
  const hasFocusAreas = (draft.focusAreas?.length ?? 0) > 0;

  // Validation
  const isValid = isContentValid && hasTitle && hasSubject;
  const availableCredits = Number.parseFloat(credits?.available ?? '0');
  const gradingCost = Number.parseFloat(credits?.gradingCost ?? '1');
  const hasEnoughCredits = availableCredits >= gradingCost;

  // Quality score for meter (0-100)
  const qualityScore = (() => {
    let score = 0;
    if (hasContent) {
      score += 30;
    } // Base for having content
    if (hasTitle) {
      score += 10;
    }
    if (hasSubject) {
      score += 10;
    }
    if (hasInstructions) {
      score += 20;
    }
    if (hasRubric) {
      score += 20;
    }
    if (hasFocusAreas) {
      score += 10;
    }
    return score;
  })();

  // ---------------------------------------------------------------------------
  // Submit Handler
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col">
      {/* Dev Tools */}
      <DevSampleLoader onLoad={handleLoadSample} />

      {/* Save Status */}
      <div className="mb-6 flex justify-end">
        <SaveIndicator status={saveStatus} />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Essay Input - The Hero */}
        <motion.div variants={fadeInUp} className="space-y-3">
          <EssayContentInput
            placeholder="Paste your essay here, or drag & drop a PDF, Word, or text file..."
            value={draft.content ?? ''}
            onChange={updateContent}
          />

          {/* Word Count Bar - Shows after content */}
          <AnimatePresence>
            {hasContent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex size-8 items-center justify-center rounded-lg',
                      isContentValid ? 'bg-green-500/10' : 'bg-amber-500/10',
                    )}
                    >
                      {isContentValid
                        ? <CheckCircle2 className="size-4 text-green-600" />
                        : <FileText className="size-4 text-amber-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        <span className={cn(
                          'tabular-nums',
                          isContentValid ? 'text-green-600' : 'text-amber-600',
                        )}
                        >
                          {wordCount.toLocaleString()}
                        </span>
                        {' '}
                        words
                      </p>
                      {!isContentValid && wordCount < MIN_WORDS && (
                        <p className="text-xs text-muted-foreground">
                          {MIN_WORDS - wordCount}
                          {' '}
                          more words needed
                        </p>
                      )}
                    </div>
                  </div>
                  {isContentValid && (
                    <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
                      Ready
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Title & Subject - Appear after content */}
        <AnimatePresence>
          {hasContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="space-y-4"
            >
              {/* Title Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="essay-title" className="text-sm font-medium">
                    Title
                    <span className="ml-0.5 text-destructive">*</span>
                  </label>
                  {isGeneratingSuggestions && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      Generating...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="essay-title"
                    placeholder="Essay title..."
                    value={draft.assignmentBrief?.title ?? ''}
                    onChange={e => updateTitle(e.target.value)}
                    className={cn(
                      'h-11 pr-10',
                      hasGeneratedSuggestions && draft.assignmentBrief?.title && 'border-primary/30',
                    )}
                  />
                  {hasGeneratedSuggestions && (
                    <button
                      type="button"
                      onClick={handleGenerateSuggestions}
                      disabled={isGeneratingSuggestions}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                      title="Regenerate title"
                    >
                      <RefreshCw className={cn(
                        'size-4',
                        isGeneratingSuggestions && 'animate-spin',
                      )}
                      />
                    </button>
                  )}
                </div>
                {hasGeneratedSuggestions && draft.assignmentBrief?.title && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="size-3 text-primary" />
                    AI-suggested title
                  </p>
                )}
              </div>

              {/* Subject Input */}
              <div className="space-y-2">
                <label htmlFor="essay-subject" className="text-sm font-medium">
                  Subject
                  <span className="ml-0.5 text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="essay-subject"
                    placeholder="e.g., English Literature, History, Psychology..."
                    value={draft.assignmentBrief?.subject ?? ''}
                    onChange={e => updateSubject(e.target.value)}
                    className={cn(
                      'h-11 pr-10',
                      hasGeneratedSuggestions && draft.assignmentBrief?.subject && 'border-primary/30',
                    )}
                  />
                  {hasGeneratedSuggestions && (
                    <button
                      type="button"
                      onClick={handleGenerateSuggestions}
                      disabled={isGeneratingSuggestions}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                      title="Regenerate subject"
                    >
                      <RefreshCw className={cn(
                        'size-4',
                        isGeneratingSuggestions && 'animate-spin',
                      )}
                      />
                    </button>
                  )}
                </div>
                {hasGeneratedSuggestions && draft.assignmentBrief?.subject && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="size-3 text-primary" />
                    AI-suggested subject
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhancement Panel - Collapsed by default */}
        <AnimatePresence>
          {hasContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <FeedbackQualityMeter score={qualityScore} />

              <EnhancementPanel
                instructions={draft.assignmentBrief?.instructions ?? ''}
                rubric={draft.rubric?.customCriteria ?? ''}
                focusAreas={draft.focusAreas ?? []}
                onUpdateInstructions={updateInstructions}
                onUpdateRubric={updateRubric}
                onUpdateFocusAreas={updateFocusAreas}
                hasInstructions={hasInstructions}
                hasRubric={hasRubric}
                hasFocusAreas={hasFocusAreas}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credits Warning */}
        <AnimatePresence>
          {hasContent && !hasEnoughCredits && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  You need
                  {' '}
                  {credits?.gradingCost ?? '...'}
                  {' '}
                  credits to submit.
                  You have
                  {' '}
                  {credits?.available ?? '0.00'}
                  {' '}
                  credits available.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Section */}
        <AnimatePresence>
          {hasContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="sticky bottom-4 z-10"
            >
              <div className="rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  {/* Validation hints */}
                  <div className="hidden text-sm text-muted-foreground sm:block">
                    {!isContentValid && wordCount < MIN_WORDS && (
                      <span>
                        Add
                        {MIN_WORDS - wordCount}
                        {' '}
                        more words
                      </span>
                    )}
                    {isContentValid && !hasTitle && (
                      <span>Add a title</span>
                    )}
                    {isContentValid && hasTitle && !hasSubject && (
                      <span>Add a subject</span>
                    )}
                    {isValid && hasEnoughCredits && (
                      <span className="text-green-600">Ready to submit</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Cost indicator */}
                    <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                      <Coins className="size-4 text-primary" />
                      <span className="font-medium tabular-nums">
                        {credits?.gradingCost ?? '...'}
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
                              Get Feedback
                              <Send className="size-4" />
                            </>
                          )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
