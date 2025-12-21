'use client';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssignmentBriefTab } from '@/features/essays/AssignmentBriefTab';
import { EssayContentTab } from '@/features/essays/EssayContentTab';
import { FocusAreasTab } from '@/features/essays/FocusAreasTab';
import { useAutosave } from '@/hooks/useAutosave';
import { useCredits } from '@/hooks/useCredits';
import type { AssignmentBrief, Rubric } from '@/models/Schema';

export type DraftData = {
  assignmentBrief: Partial<AssignmentBrief> | null;
  rubric: Partial<Rubric> | null;
  content: string | null;
  focusAreas: string[] | null;
};

export function SubmitForm() {
  const router = useRouter();
  const { credits, refresh: refreshCredits } = useCredits();

  const [activeTab, setActiveTab] = useState('brief');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [draft, setDraft] = useState<DraftData>({
    assignmentBrief: null,
    rubric: null,
    content: null,
    focusAreas: null,
  });

  // Load existing draft on mount
  useEffect(() => {
    async function loadDraft() {
      try {
        const res = await fetch('/api/essays/draft');
        const data = await res.json();
        if (data) {
          setDraft({
            assignmentBrief: data.assignmentBrief,
            rubric: data.rubric,
            content: data.content,
            focusAreas: data.focusAreas,
          });
        }
      } catch {
        // Ignore errors loading draft
      }
    }
    loadDraft();
  }, []);

  // Autosave hook
  const { status: saveStatus } = useAutosave({
    data: draft,
    onSave: async (data) => {
      await fetch('/api/essays/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
  });

  // Update handlers
  const updateAssignmentBrief = useCallback((updates: Partial<AssignmentBrief>) => {
    setDraft(prev => ({
      ...prev,
      assignmentBrief: { ...prev.assignmentBrief, ...updates },
    }));
  }, []);

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

  // Word count calculation
  const wordCount = draft.content?.trim().split(/\s+/).filter(Boolean).length ?? 0;

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

  // Submit handler
  const handleSubmit = async () => {
    if (!isValid || !hasEnoughCredits) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/essays/submit', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit essay');
      }

      // Refresh credits and redirect to grade page
      await refreshCredits();
      router.push(`/grades/${data.gradeId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit essay');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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
