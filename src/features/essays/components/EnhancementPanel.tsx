'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Plus,
  Target,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextareaWithUpload } from '@/components/ui/textarea-with-upload';
import { cn } from '@/utils/Helpers';

// =============================================================================
// Types
// =============================================================================

type Props = {
  instructions: string;
  rubric: string;
  focusAreas: string[];
  onUpdateInstructions: (value: string) => void;
  onUpdateRubric: (value: string) => void;
  onUpdateFocusAreas: (value: string[]) => void;
  hasInstructions: boolean;
  hasRubric: boolean;
  hasFocusAreas: boolean;
};

// =============================================================================
// Constants
// =============================================================================

const MAX_FOCUS_AREAS = 3;

const FOCUS_AREA_SUGGESTIONS = [
  'Thesis clarity',
  'Evidence strength',
  'Argument flow',
  'Citation format',
  'Grammar & style',
  'Counter-arguments',
];

// =============================================================================
// Sub-components
// =============================================================================

type EnhancementCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  isAdded: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function EnhancementCard({
  title,
  description,
  icon,
  isAdded,
  isExpanded,
  onToggle,
  children,
}: EnhancementCardProps) {
  return (
    <div className={cn(
      'rounded-xl border transition-colors',
      isAdded ? 'border-primary/30 bg-primary/5' : 'bg-card',
    )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex size-10 items-center justify-center rounded-lg',
            isAdded ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          )}
          >
            {isAdded ? <CheckCircle2 className="size-5" /> : icon}
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <ChevronDown className={cn(
          'size-5 text-muted-foreground transition-transform',
          isExpanded && 'rotate-180',
        )}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t px-4 pb-4 pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function EnhancementPanel({
  instructions,
  rubric,
  focusAreas,
  onUpdateInstructions,
  onUpdateRubric,
  onUpdateFocusAreas,
  hasInstructions,
  hasRubric,
  hasFocusAreas,
}: Props) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    setExpandedCard(prev => (prev === cardId ? null : cardId));
  };

  // Focus area handlers
  const addFocusArea = (value: string = '') => {
    if (focusAreas.length < MAX_FOCUS_AREAS) {
      onUpdateFocusAreas([...focusAreas, value]);
    }
  };

  const removeFocusArea = (index: number) => {
    onUpdateFocusAreas(focusAreas.filter((_, i) => i !== index));
  };

  const updateFocusArea = (index: number, value: string) => {
    const updated = [...focusAreas];
    updated[index] = value;
    onUpdateFocusAreas(updated);
  };

  const addSuggestion = (suggestion: string) => {
    if (focusAreas.length < MAX_FOCUS_AREAS && !focusAreas.includes(suggestion)) {
      onUpdateFocusAreas([...focusAreas, suggestion]);
    }
  };

  const addedCount = [hasInstructions, hasRubric, hasFocusAreas].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Enhance Your Feedback
        </h3>
        {addedCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {addedCount}
            {' '}
            of 3 added
          </span>
        )}
      </div>

      {/* Assignment Instructions */}
      <EnhancementCard
        title="Assignment Instructions"
        description="Get feedback aligned to your prompt"
        icon={<BookOpen className="size-5" />}
        isAdded={hasInstructions}
        isExpanded={expandedCard === 'instructions'}
        onToggle={() => toggleCard('instructions')}
      >
        <TextareaWithUpload
          placeholder="Paste your assignment instructions here..."
          maxLength={10000}
          value={instructions}
          onChange={onUpdateInstructions}
          uploadLabel="Upload instructions"
          dropZoneTitle="Drop instructions here"
          dropZoneSubtitle="PDF, Word, or text files"
          minHeight="min-h-[160px]"
        />
      </EnhancementCard>

      {/* Rubric */}
      <EnhancementCard
        title="Grading Rubric"
        description="Grade against specific criteria"
        icon={<ClipboardList className="size-5" />}
        isAdded={hasRubric}
        isExpanded={expandedCard === 'rubric'}
        onToggle={() => toggleCard('rubric')}
      >
        <TextareaWithUpload
          placeholder="Paste your rubric criteria here..."
          maxLength={10000}
          value={rubric}
          onChange={onUpdateRubric}
          uploadLabel="Upload rubric"
          dropZoneTitle="Drop rubric here"
          dropZoneSubtitle="PDF, Word, or text files"
          minHeight="min-h-[160px]"
        />
      </EnhancementCard>

      {/* Focus Areas */}
      <EnhancementCard
        title="Focus Areas"
        description="Get targeted feedback on specific aspects"
        icon={<Target className="size-5" />}
        isAdded={hasFocusAreas}
        isExpanded={expandedCard === 'focus'}
        onToggle={() => toggleCard('focus')}
      >
        <div className="space-y-4">
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREA_SUGGESTIONS.map((suggestion) => {
              const isAdded = focusAreas.includes(suggestion);
              const isDisabled = isAdded || focusAreas.length >= MAX_FOCUS_AREAS;

              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSuggestion(suggestion)}
                  disabled={isDisabled}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-all',
                    isAdded
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : isDisabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'border-border bg-card hover:border-primary/30 hover:bg-primary/5',
                  )}
                >
                  {suggestion}
                  {isAdded && <span className="ml-1 text-xs">(added)</span>}
                </button>
              );
            })}
          </div>

          {/* Custom focus areas */}
          <AnimatePresence mode="popLayout">
            {focusAreas.map((area, index) => (

              <motion.div
                key={`focus-${index}`} // eslint-disable-line react/no-array-index-key -- append-only list, no reordering
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-medium text-primary">
                  {index + 1}
                </div>
                <Input
                  placeholder="Custom focus area..."
                  maxLength={100}
                  value={area}
                  onChange={e => updateFocusArea(index, e.target.value)}
                  className="h-9 flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFocusArea(index)}
                  className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add custom button */}
          {focusAreas.length < MAX_FOCUS_AREAS && (
            <Button
              type="button"
              variant="outline"
              onClick={() => addFocusArea()}
              className="h-9 w-full gap-2 border-dashed text-sm"
            >
              <Plus className="size-4" />
              Add custom focus area
              <span className="text-muted-foreground">
                (
                {focusAreas.length}
                /
                {MAX_FOCUS_AREAS}
                )
              </span>
            </Button>
          )}
        </div>
      </EnhancementCard>
    </div>
  );
}
