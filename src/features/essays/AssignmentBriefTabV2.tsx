'use client';

import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, HelpCircle, PenTool } from 'lucide-react';

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/Helpers';

import type { AssignmentBrief, Rubric } from '../../../convex/schema';

type Props = {
  assignmentBrief: Partial<AssignmentBrief> | null;
  rubric: Partial<Rubric> | null;
  onUpdateBrief: (updates: Partial<AssignmentBrief>) => void;
  onUpdateRubric: (updates: Partial<Rubric>) => void;
};

const staggerVariants = {
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

type FieldWrapperProps = {
  label: string;
  required?: boolean;
  tooltip?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  characterCount?: { current: number; max: number };
};

function FieldWrapper({ label, required, tooltip, icon, children, characterCount }: FieldWrapperProps) {
  return (
    <motion.div variants={itemVariants} className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="size-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {characterCount && (
          <span className={cn(
            'text-xs tabular-nums',
            characterCount.current > characterCount.max * 0.9
              ? 'text-amber-500'
              : 'text-muted-foreground',
          )}
          >
            {characterCount.current.toLocaleString()}
            /
            {characterCount.max.toLocaleString()}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

export function AssignmentBriefTabV2({
  assignmentBrief,
  rubric,
  onUpdateBrief,
  onUpdateRubric,
}: Props) {
  return (
    <motion.div
      className="space-y-8"
      variants={staggerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-1">
        <h2 className="text-xl font-semibold">Assignment Details</h2>
        <p className="text-sm text-muted-foreground">
          Tell us about your assignment so we can provide relevant feedback.
        </p>
      </motion.div>

      {/* Title */}
      <FieldWrapper
        label="Essay Title"
        required
        tooltip="Give your essay a descriptive title"
        icon={<PenTool className="size-4 text-muted-foreground" />}
        characterCount={{ current: assignmentBrief?.title?.length ?? 0, max: 200 }}
      >
        <Input
          placeholder="e.g., Renaissance Art and Its Influence on Modern Design"
          maxLength={200}
          value={assignmentBrief?.title ?? ''}
          onChange={e => onUpdateBrief({ title: e.target.value })}
          className="h-11"
        />
      </FieldWrapper>

      {/* Instructions */}
      <FieldWrapper
        label="Assignment Instructions"
        required
        tooltip="Include any specific requirements, formatting guidelines, or rubric criteria from your instructor"
        icon={<BookOpen className="size-4 text-muted-foreground" />}
        characterCount={{ current: assignmentBrief?.instructions?.length ?? 0, max: 10000 }}
      >
        <Textarea
          placeholder="Paste your assignment instructions here. Include any specific requirements, formatting guidelines, or rubric criteria..."
          className="min-h-36 resize-y"
          maxLength={10000}
          value={assignmentBrief?.instructions ?? ''}
          onChange={e => onUpdateBrief({ instructions: e.target.value })}
        />
      </FieldWrapper>

      {/* Subject and Academic Level - Side by side on larger screens */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Subject */}
        <FieldWrapper
          label="Subject Area"
          required
          tooltip="The academic subject or discipline"
        >
          <Input
            placeholder="e.g., Art History, English Literature"
            maxLength={100}
            value={assignmentBrief?.subject ?? ''}
            onChange={e => onUpdateBrief({ subject: e.target.value })}
            className="h-11"
          />
        </FieldWrapper>

        {/* Academic Level */}
        <FieldWrapper
          label="Academic Level"
          icon={<GraduationCap className="size-4 text-muted-foreground" />}
          tooltip="This helps calibrate feedback to appropriate expectations"
        >
          <Select
            value={assignmentBrief?.academicLevel ?? ''}
            onValueChange={(value) => {
              onUpdateBrief({
                academicLevel: value as AssignmentBrief['academicLevel'],
              });
            }}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high_school">High School</SelectItem>
              <SelectItem value="undergraduate">Undergraduate</SelectItem>
              <SelectItem value="postgraduate">Postgraduate</SelectItem>
            </SelectContent>
          </Select>
        </FieldWrapper>
      </div>

      {/* Custom Rubric */}
      <FieldWrapper
        label="Custom Rubric"
        tooltip="Provide specific grading criteria if you have them. This helps the AI focus on what matters most for your assignment."
        characterCount={{ current: rubric?.customCriteria?.length ?? 0, max: 10000 }}
      >
        <Textarea
          placeholder="Optional: Paste your rubric or specific grading criteria here. For example: 'Thesis clarity (30%), evidence quality (40%), writing style (30%)'"
          className="min-h-28 resize-y"
          maxLength={10000}
          value={rubric?.customCriteria ?? ''}
          onChange={e => onUpdateRubric({ customCriteria: e.target.value })}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Optional but recommended. Helps the AI align feedback with your instructor&apos;s expectations.
        </p>
      </FieldWrapper>
    </motion.div>
  );
}
