'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, FileUp, Loader2, Upload } from 'lucide-react';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { cn } from '@/utils/Helpers';

// =============================================================================
// Types
// =============================================================================

type TextareaProps = React.ComponentProps<'textarea'>;

type Props = Omit<TextareaProps, 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
  uploadLabel?: string;
};

// =============================================================================
// Component
// =============================================================================

/**
 * A textarea that doubles as a file drop zone.
 * Supports drag-and-drop or click-to-browse for PDF, DOCX, and TXT files.
 * When a file is processed, its content populates the textarea.
 */
export function TextareaWithUpload({
  value,
  onChange,
  uploadLabel = 'Upload document',
  className,
  disabled,
  ...textareaProps
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useDocumentUpload();

  const isProcessing = upload.state === 'uploading' || upload.state === 'processing';
  const hasError = upload.state === 'error';

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isProcessing) {
        setIsDragging(true);
      }
    },
    [disabled, isProcessing],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isProcessing) {
        return;
      }

      const file = e.dataTransfer.files[0];
      if (file) {
        const result = await upload.upload(file);
        if (result) {
          onChange(result.markdown);
          upload.reset();
        }
      }
    },
    [disabled, isProcessing, upload, onChange],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const result = await upload.upload(file);
        if (result) {
          onChange(result.markdown);
          upload.reset();
        }
      }
      // Reset input for re-selection
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [upload, onChange],
  );

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inputRef.current?.click();
  };

  const handleClearError = () => {
    upload.reset();
  };

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
        aria-label={uploadLabel}
        disabled={disabled || isProcessing}
      />

      {/* Main textarea with drop zone behavior */}
      <div
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled || isProcessing}
          className={cn(
            'transition-all duration-200',
            isDragging && 'border-primary bg-primary/5 ring-2 ring-primary/20',
            isProcessing && 'opacity-50',
            className,
          )}
          {...textareaProps}
        />

        {/* Upload button in corner */}
        <button
          type="button"
          onClick={handleBrowseClick}
          disabled={disabled || isProcessing}
          className={cn(
            'absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md px-2.5 py-1.5',
            'bg-muted/80 text-xs font-medium text-muted-foreground',
            'transition-all hover:bg-muted hover:text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
          aria-label={uploadLabel}
        >
          <FileUp className="size-3.5" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/10"
            >
              <div className="flex flex-col items-center gap-2 text-primary">
                <Upload className="size-8" />
                <p className="text-sm font-medium">Drop file here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center rounded-md bg-background/80 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="size-8 animate-spin text-primary" />
                <div>
                  <p className="font-medium">
                    {upload.state === 'uploading' ? 'Uploading...' : 'Processing document...'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {upload.state === 'processing' ? 'Extracting text (2-5 seconds)' : 'Please wait'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {hasError && upload.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3"
          >
            <AlertCircle className="size-4 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{upload.error.message}</p>
              <button
                type="button"
                onClick={handleClearError}
                className="mt-1 text-xs text-muted-foreground underline hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
