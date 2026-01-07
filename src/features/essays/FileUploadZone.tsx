'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useRef } from 'react';

import { Button } from '@/components/ui/button';
import type { UploadError, UploadResult, UploadState } from '@/hooks/useDocumentUpload';
import { cn } from '@/utils/Helpers';

// =============================================================================
// Types
// =============================================================================

type Props = {
  state: UploadState;
  error: UploadError | null;
  result: UploadResult | null;
  onUpload: (file: File) => Promise<UploadResult | null>;
  onReset: () => void;
  onDragOver: (isDragging: boolean) => void;
  onAccept: (markdown: string) => void;
  disabled?: boolean;
};

// =============================================================================
// Constants
// =============================================================================

const ACCEPTED_TYPES = '.pdf,.docx,.txt';

// =============================================================================
// Component
// =============================================================================

export function FileUploadZone({
  state,
  error,
  result,
  onUpload,
  onReset,
  onDragOver,
  onAccept,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        onDragOver(true);
      }
    },
    [disabled, onDragOver],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onDragOver(false);
    },
    [onDragOver],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      onDragOver(false);
      if (disabled) {
        return;
      }

      const file = e.dataTransfer.files[0];
      if (file) {
        await onUpload(file);
      }
    },
    [disabled, onDragOver, onUpload],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await onUpload(file);
      }
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [onUpload],
  );

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [],
  );

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload document"
      />

      <AnimatePresence mode="wait">
        {/* Idle / Drag-over state */}
        {(state === 'idle' || state === 'drag-over') && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'relative rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer',
              state === 'drag-over'
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 bg-muted/20 hover:border-muted-foreground/50',
              disabled && 'pointer-events-none opacity-50',
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Drop zone for document upload. Press Enter or Space to browse files."
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div
                className={cn(
                  'flex size-14 items-center justify-center rounded-full',
                  state === 'drag-over' ? 'bg-primary/10' : 'bg-muted',
                )}
              >
                <Upload
                  className={cn(
                    'size-7',
                    state === 'drag-over' ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
              </div>

              <div>
                <p className="font-medium">
                  {state === 'drag-over'
                    ? 'Drop your file here'
                    : 'Drag and drop your document'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  PDF, DOCX, or TXT (max 10 MB)
                </p>
              </div>

              {/* Mobile-friendly browse button */}
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
                className="gap-2"
              >
                <FileText className="size-4" />
                Browse Files
              </Button>
            </div>
          </motion.div>
        )}

        {/* Uploading / Processing state */}
        {(state === 'uploading' || state === 'processing') && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border bg-muted/30 p-8"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="size-10 animate-spin text-primary" />
              <div>
                <p className="font-medium">
                  {state === 'uploading' ? 'Uploading...' : 'Processing document...'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {state === 'processing'
                    ? 'Extracting text and formatting (2-5 seconds)'
                    : 'Please wait'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success state */}
        {state === 'success' && result && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-green-500/30 bg-green-500/5 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="size-5 text-green-600" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-green-600">Document processed</p>
                    <p className="text-sm text-muted-foreground">
                      {result.fileName}
                      {' '}
                      &bull;
                      {result.wordCount.toLocaleString()}
                      {' '}
                      words
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onReset}
                    className="shrink-0"
                    aria-label="Remove uploaded file"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {/* Preview */}
                <div className="mt-4 rounded-lg bg-background/50 p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Preview</p>
                  <p className="line-clamp-3 text-sm">{result.preview}</p>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-3">
                  <Button
                    type="button"
                    onClick={() => onAccept(result.markdown)}
                    className="gap-2"
                  >
                    <CheckCircle2 className="size-4" />
                    Use This Content
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onReset}
                    className="gap-2"
                  >
                    <RefreshCw className="size-4" />
                    Upload Different File
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {state === 'error' && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
            role="alert"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="size-5 text-destructive" />
              </div>

              <div className="flex-1">
                <p className="font-medium text-destructive">Upload failed</p>
                <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onReset}
                  className="mt-4 gap-2"
                >
                  <RefreshCw className="size-4" />
                  Try Again
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
