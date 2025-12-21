'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  content: string;
  wordCount: number;
  onUpdate: (content: string) => void;
};

const MIN_WORDS = 50;
const MAX_WORDS = 50000;

export function EssayContentTab({ content, wordCount, onUpdate }: Props) {
  const isTooShort = wordCount > 0 && wordCount < MIN_WORDS;
  const isTooLong = wordCount > MAX_WORDS;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="content">
          Essay Content
          {' '}
          <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Paste your essay content below. Minimum 50 words, maximum 50,000 words.
        </p>
        <Textarea
          id="content"
          placeholder="Paste your essay here..."
          className="min-h-80 font-mono text-sm"
          value={content}
          onChange={e => onUpdate(e.target.value)}
        />
      </div>

      {/* Word Count */}
      <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
        <div>
          <span className="font-medium">Word Count: </span>
          <span
            className={
              isTooShort || isTooLong
                ? 'text-destructive'
                : wordCount > 0
                  ? 'text-green-600'
                  : ''
            }
          >
            {wordCount.toLocaleString()}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {isTooShort && (
            <span className="text-destructive">
              Minimum
              {' '}
              {MIN_WORDS}
              {' '}
              words required
            </span>
          )}
          {isTooLong && (
            <span className="text-destructive">
              Maximum
              {' '}
              {MAX_WORDS.toLocaleString()}
              {' '}
              words exceeded
            </span>
          )}
          {!isTooShort && !isTooLong && wordCount > 0 && (
            <span className="text-green-600">Ready to submit</span>
          )}
        </div>
      </div>

      {/* Document Upload Placeholder */}
      <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
        <p className="text-sm">
          Document upload (PDF, DOCX) coming soon. For now, please paste your essay content above.
        </p>
      </div>
    </div>
  );
}
