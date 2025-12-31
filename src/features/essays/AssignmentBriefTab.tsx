'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type { AssignmentBrief, Rubric } from '../../../convex/schema';

type Props = {
  assignmentBrief: Partial<AssignmentBrief> | null;
  rubric: Partial<Rubric> | null;
  onUpdateBrief: (updates: Partial<AssignmentBrief>) => void;
  onUpdateRubric: (updates: Partial<Rubric>) => void;
};

export function AssignmentBriefTab({
  assignmentBrief,
  rubric,
  onUpdateBrief,
  onUpdateRubric,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title
          {' '}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Renaissance Art History Essay"
          maxLength={200}
          value={assignmentBrief?.title ?? ''}
          onChange={e => onUpdateBrief({ title: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          {(assignmentBrief?.title?.length ?? 0)}
          /200 characters
        </p>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <Label htmlFor="instructions">
          Assignment Instructions
          {' '}
          <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="instructions"
          placeholder="What does the assignment ask for? Include any specific requirements..."
          className="min-h-32"
          maxLength={10000}
          value={assignmentBrief?.instructions ?? ''}
          onChange={e => onUpdateBrief({ instructions: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          {(assignmentBrief?.instructions?.length ?? 0).toLocaleString()}
          /10,000 characters
        </p>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject">
          Subject
          {' '}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="subject"
          placeholder="e.g., History, English Literature, Psychology"
          maxLength={100}
          value={assignmentBrief?.subject ?? ''}
          onChange={e => onUpdateBrief({ subject: e.target.value })}
        />
      </div>

      {/* Academic Level */}
      <div className="space-y-2">
        <Label htmlFor="academicLevel">Academic Level</Label>
        <Select
          value={assignmentBrief?.academicLevel ?? ''}
          onValueChange={(value) => {
            onUpdateBrief({
              academicLevel: value as AssignmentBrief['academicLevel'],
            });
          }}
        >
          <SelectTrigger id="academicLevel">
            <SelectValue placeholder="Select academic level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high_school">High School</SelectItem>
            <SelectItem value="undergraduate">Undergraduate</SelectItem>
            <SelectItem value="postgraduate">Postgraduate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Rubric */}
      <div className="space-y-2">
        <Label htmlFor="rubric">Custom Rubric (Optional)</Label>
        <Textarea
          id="rubric"
          placeholder="Specific criteria to grade against, e.g., 'Focus on thesis clarity (30%), evidence quality (40%), writing style (30%)'"
          className="min-h-24"
          maxLength={10000}
          value={rubric?.customCriteria ?? ''}
          onChange={e => onUpdateRubric({ customCriteria: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          {(rubric?.customCriteria?.length ?? 0).toLocaleString()}
          /10,000 characters
        </p>
      </div>
    </div>
  );
}
