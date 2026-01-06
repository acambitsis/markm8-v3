'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Lightbulb, Plus, Sparkles, Target, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/Helpers';

type Props = {
  focusAreas: string[];
  onUpdate: (focusAreas: string[]) => void;
};

const MAX_FOCUS_AREAS = 3;

const SUGGESTIONS = [
  { label: 'Thesis clarity', icon: Target },
  { label: 'Evidence strength', icon: Sparkles },
  { label: 'Argument flow', icon: Lightbulb },
  { label: 'Citation format', icon: Target },
  { label: 'Grammar & style', icon: Sparkles },
  { label: 'Counter-arguments', icon: Lightbulb },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

export function FocusAreasTabV2({ focusAreas, onUpdate }: Props) {
  const addFocusArea = (value: string = '') => {
    if (focusAreas.length < MAX_FOCUS_AREAS) {
      onUpdate([...focusAreas, value]);
    }
  };

  const removeFocusArea = (index: number) => {
    onUpdate(focusAreas.filter((_, i) => i !== index));
  };

  const updateFocusArea = (index: number, value: string) => {
    const updated = [...focusAreas];
    updated[index] = value;
    onUpdate(updated);
  };

  const addSuggestion = (suggestion: string) => {
    if (focusAreas.length < MAX_FOCUS_AREAS && !focusAreas.includes(suggestion)) {
      onUpdate([...focusAreas, suggestion]);
    }
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-1">
        <h2 className="text-xl font-semibold">Focus Areas</h2>
        <p className="text-sm text-muted-foreground">
          Tell us what you want specific feedback on. Leave empty for general feedback.
        </p>
      </motion.div>

      {/* Focus Area Inputs */}
      <motion.div variants={itemVariants} className="space-y-3">
        <AnimatePresence mode="popLayout">
          {focusAreas.map((area, index) => (
            <motion.div
              key={`focus-area-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: -20 }}
              transition={{ duration: 0.2 }}
              className="group flex items-center gap-3"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-medium text-primary">
                {index + 1}
              </div>
              <Input
                placeholder={
                  index === 0
                    ? 'e.g., Thesis statement clarity'
                    : index === 1
                      ? 'e.g., APA citation format'
                      : 'e.g., Counter-argument strength'
                }
                maxLength={100}
                value={area}
                onChange={e => updateFocusArea(index, e.target.value)}
                className="h-11 flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFocusArea(index)}
                className="size-10 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="size-5" />
                <span className="sr-only">Remove focus area</span>
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add button */}
        {focusAreas.length < MAX_FOCUS_AREAS && (
          <motion.div layout>
            <Button
              type="button"
              variant="outline"
              onClick={() => addFocusArea()}
              className="h-11 w-full gap-2 border-dashed"
            >
              <Plus className="size-4" />
              Add Focus Area
              <span className="text-muted-foreground">
                (
                {focusAreas.length}
                /
                {MAX_FOCUS_AREAS}
                )
              </span>
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Suggestions */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lightbulb className="size-4" />
          Quick suggestions
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => {
            const isAdded = focusAreas.includes(suggestion.label);
            const isDisabled = isAdded || focusAreas.length >= MAX_FOCUS_AREAS;

            return (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => addSuggestion(suggestion.label)}
                disabled={isDisabled}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
                  isAdded
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : isDisabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-primary/5',
                )}
              >
                <suggestion.icon className="size-3.5" />
                {suggestion.label}
                {isAdded && <span className="text-xs">(added)</span>}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Empty state info */}
      {focusAreas.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-dashed bg-muted/30 p-6 text-center"
        >
          <Target className="mx-auto size-10 text-muted-foreground/50" />
          <h3 className="mt-3 font-medium">No focus areas yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This step is optional. Without focus areas, you&apos;ll receive general feedback covering all aspects of your essay.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
