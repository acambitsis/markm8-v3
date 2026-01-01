'use client';

import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  focusAreas: string[];
  onUpdate: (focusAreas: string[]) => void;
};

const MAX_FOCUS_AREAS = 3;

export function FocusAreasTab({ focusAreas, onUpdate }: Props) {
  const addFocusArea = () => {
    if (focusAreas.length < MAX_FOCUS_AREAS) {
      onUpdate([...focusAreas, '']);
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

  return (
    <div className="space-y-6">
      <div>
        <Label>Focus Areas (Optional)</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Specify up to 3 areas you want the AI to emphasize in its feedback. Leave empty to get general feedback.
        </p>
      </div>

      <div className="space-y-3">
        {focusAreas.map((area, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`focus-area-${index}-${area.slice(0, 10)}`} className="flex items-center gap-2">
            <Input
              placeholder={`e.g., ${index === 0 ? 'Thesis statement clarity' : index === 1 ? 'APA citation format' : 'Counter-argument strength'}`}
              maxLength={100}
              value={area}
              onChange={e => updateFocusArea(index, e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeFocusArea(index)}
            >
              <X className="size-4" />
              <span className="sr-only">Remove focus area</span>
            </Button>
          </div>
        ))}

        {focusAreas.length < MAX_FOCUS_AREAS && (
          <Button
            type="button"
            variant="outline"
            onClick={addFocusArea}
            className="w-full"
          >
            <Plus className="mr-2 size-4" />
            Add Focus Area
          </Button>
        )}
      </div>

      {focusAreas.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          <p>No focus areas added yet.</p>
          <p className="text-sm">Click the button above to add specific areas for feedback.</p>
        </div>
      )}
    </div>
  );
}
