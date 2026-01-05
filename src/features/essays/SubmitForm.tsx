'use client';

import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssignmentBriefTab } from '@/features/essays/AssignmentBriefTab';
import { DevSampleLoader } from '@/features/essays/DevSampleLoader';
import { EssayContentTab } from '@/features/essays/EssayContentTab';
import { FocusAreasTab } from '@/features/essays/FocusAreasTab';
import { useAutosave } from '@/hooks/useAutosave';
import { useCredits } from '@/hooks/useCredits';

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

  // Autosave hook - now uses Convex mutation
  const { status: saveStatus } = useAutosave({
    data: draft,
    onSave: async (data) => {
      await saveDraft({
        assignmentBrief: data.assignmentBrief
          ? {
              title: data.assignmentBrief.title,
              instructions: data.assignmentBrief.instructions,
              subject: data.assignmentBrief.subject,
              academicLevel: data.assignmentBrief.academicLevel as AcademicLevel,
            }
          : undefined,
        rubric: data.rubric
          ? {
              customCriteria: data.rubric.customCriteria,
              focusAreas: data.rubric.focusAreas,
            }
          : undefined,
        content: data.content ?? undefined,
        focusAreas: data.focusAreas ?? undefined,
      });
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
      await saveDraft({
        assignmentBrief: draft.assignmentBrief
          ? {
              title: draft.assignmentBrief.title ?? undefined,
              instructions: draft.assignmentBrief.instructions ?? undefined,
              subject: draft.assignmentBrief.subject ?? undefined,
              academicLevel: draft.assignmentBrief.academicLevel as AcademicLevel,
            }
          : undefined,
        rubric: draft.rubric
          ? {
              customCriteria: draft.rubric.customCriteria ?? undefined,
              focusAreas: draft.rubric.focusAreas ?? undefined,
            }
          : undefined,
        content: draft.content ?? undefined,
        focusAreas: draft.focusAreas ?? undefined,
      });

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

  return (
    <div className="space-y-6">
      {/* Dev Tools - Only renders in development */}
      <DevSampleLoader onLoad={handleLoadSample} />

      {/* Save Status */}
      <div className="flex items-center justify-end text-sm text-muted-foreground">
        {saveStatus === 'saving' && (
          <span className="flex items-center gap-1">
            <Loader2 className="size-3 animate-spin" />
            Saving...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="size-3" />
            Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertCircle className="size-3" />
            Save failed
          </span>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="brief">1. Assignment Brief</TabsTrigger>
          <TabsTrigger value="focus">2. Focus Areas</TabsTrigger>
          <TabsTrigger value="content">3. Essay Content</TabsTrigger>
        </TabsList>

        <TabsContent value="brief" className="mt-6">
          <AssignmentBriefTab
            assignmentBrief={draft.assignmentBrief}
            rubric={draft.rubric}
            onUpdateBrief={updateAssignmentBrief}
            onUpdateRubric={updateRubric}
          />
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setActiveTab('focus')}>
              Next: Focus Areas
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="focus" className="mt-6">
          <FocusAreasTab
            focusAreas={draft.focusAreas ?? []}
            onUpdate={updateFocusAreas}
          />
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('brief')}>
              Back
            </Button>
            <Button onClick={() => setActiveTab('content')}>
              Next: Essay Content
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <EssayContentTab
            content={draft.content ?? ''}
            wordCount={wordCount}
            onUpdate={updateContent}
          />

          {/* Error Alert */}
          {submitError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="size-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Credits Warning */}
          {!hasEnoughCredits && (
            <Alert variant="destructive" className="mt-4">
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

          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => setActiveTab('focus')}>
              Back
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Cost: 1.00 credits
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || !hasEnoughCredits || isSubmitting}
              >
                {isSubmitting
                  ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Submitting...
                      </>
                    )
                  : (
                      'Submit for Grading'
                    )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
