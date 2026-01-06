'use client';

import { ChevronDown, FlaskConical } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/Helpers';

import type { AssignmentBrief, Rubric } from '../../../convex/schema';
import { getSampleEssayById, getSampleEssays } from './sampleEssays';

type Props = {
  onLoad: (data: {
    assignmentBrief: Partial<AssignmentBrief>;
    rubric: Partial<Rubric>;
    content: string;
    focusAreas: string[];
  }) => void;
};

/**
 * Dev-only component for loading sample essays during testing.
 * Shows in development mode OR when NEXT_PUBLIC_ENABLE_DEV_TOOLS is set.
 */
export function DevSampleLoader({ onLoad }: Props) {
  const isDev = process.env.NODE_ENV === 'development';
  const devToolsEnabled = process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true';

  if (!isDev && !devToolsEnabled) {
    return null;
  }

  return <DevSampleLoaderInner onLoad={onLoad} />;
}

function DevSampleLoaderInner({ onLoad }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');

  const samples = getSampleEssays();

  const handleLoad = () => {
    if (!selectedId) {
      return;
    }

    const sample = getSampleEssayById(selectedId);
    if (!sample) {
      return;
    }

    onLoad({
      assignmentBrief: {
        title: sample.title,
        instructions: sample.instructions,
        subject: sample.subject,
        academicLevel: sample.academicLevel,
      },
      rubric: {
        customCriteria: sample.customRubric,
        focusAreas: sample.focusAreas,
      },
      content: sample.content,
      focusAreas: sample.focusAreas,
    });

    // Close after loading
    setIsOpen(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-dashed border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-medium text-amber-700 hover:bg-amber-100/50 dark:text-amber-400 dark:hover:bg-amber-900/30"
          >
            <span className="flex items-center gap-2">
              <FlaskConical className="size-4" />
              Dev Tools
            </span>
            <ChevronDown
              className={cn('size-4 transition-transform', isOpen && 'rotate-180')}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="flex items-center gap-2 border-t border-amber-500/30 px-4 py-3">
            <span className="text-sm text-amber-700 dark:text-amber-400">
              Load sample:
            </span>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-64 border-amber-500/50 bg-white dark:bg-amber-950/30">
                <SelectValue placeholder="Select a sample..." />
              </SelectTrigger>
              <SelectContent>
                {samples.map(sample => (
                  <SelectItem key={sample.id} value={sample.id}>
                    {sample.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLoad}
              disabled={!selectedId}
              className="border-amber-500/50 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              Load
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
