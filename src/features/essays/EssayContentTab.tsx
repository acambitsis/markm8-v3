'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

import { EssayContentInput } from '@/components/ui/essay-content-input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/Helpers';

type Props = {
  content: string;
  wordCount: number;
  onUpdate: (content: string) => void;
};

const MIN_WORDS = 50;
const MAX_WORDS = 50000;

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

export function EssayContentTab({ content, wordCount, onUpdate }: Props) {
  const isTooShort = wordCount > 0 && wordCount < MIN_WORDS;
  const isTooLong = wordCount > MAX_WORDS;
  const isValid = wordCount >= MIN_WORDS && wordCount <= MAX_WORDS;

  // Calculate progress percentage (capped at 100%)
  const progressPercent = Math.min((wordCount / MIN_WORDS) * 100, 100);

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-1">
        <h2 className="text-xl font-semibold">Essay Content</h2>
        <p className="text-sm text-muted-foreground">
          Paste your essay or drag & drop a document. We&apos;ll analyze it and provide detailed feedback.
        </p>
      </motion.div>

      {/* Essay Input */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <FileText className="size-4 text-muted-foreground" />
            Your Essay
            <span className="text-destructive">*</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {MIN_WORDS.toLocaleString()}
            {' '}
            -
            {' '}
            {MAX_WORDS.toLocaleString()}
            {' '}
            words
          </span>
        </div>

        <EssayContentInput
          placeholder="Paste your essay here, or drag & drop a PDF, Word, or text file..."
          value={content}
          onChange={onUpdate}
        />
      </motion.div>

      {/* Word Count Bar */}
      <motion.div variants={itemVariants}>
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {/* Status icon */}
              <div className={cn(
                'flex size-10 items-center justify-center rounded-lg',
                isValid && 'bg-green-500/10',
                isTooShort && 'bg-amber-500/10',
                isTooLong && 'bg-destructive/10',
                wordCount === 0 && 'bg-muted',
              )}
              >
                {isValid && <CheckCircle2 className="size-5 text-green-600" />}
                {(isTooShort || isTooLong) && <AlertTriangle className="size-5 text-amber-500" />}
                {wordCount === 0 && <FileText className="size-5 text-muted-foreground" />}
              </div>

              {/* Word count text */}
              <div>
                <p className="font-medium">
                  <span className={cn(
                    'tabular-nums',
                    isValid && 'text-green-600',
                    (isTooShort || isTooLong) && 'text-amber-600',
                  )}
                  >
                    {wordCount.toLocaleString()}
                  </span>
                  {' '}
                  words
                </p>
                <p className="text-sm text-muted-foreground">
                  {wordCount === 0 && 'Start typing, paste, or drop your essay'}
                  {isTooShort && `${MIN_WORDS - wordCount} more words needed`}
                  {isTooLong && `${wordCount - MAX_WORDS} words over limit`}
                  {isValid && 'Ready to submit'}
                </p>
              </div>
            </div>

            {/* Status badge */}
            {wordCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium',
                  isValid && 'bg-green-500/10 text-green-600',
                  isTooShort && 'bg-amber-500/10 text-amber-600',
                  isTooLong && 'bg-destructive/10 text-destructive',
                )}
              >
                {isValid && 'Valid'}
                {isTooShort && 'Too short'}
                {isTooLong && 'Too long'}
              </motion.div>
            )}
          </div>

          {/* Progress bar (only show when below minimum) */}
          {wordCount > 0 && wordCount < MIN_WORDS && (
            <div className="border-t bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress to minimum</span>
                <span>
                  {Math.round(progressPercent)}
                  %
                </span>
              </div>
              <Progress value={progressPercent} className="mt-2 h-2" />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
