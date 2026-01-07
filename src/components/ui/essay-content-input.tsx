'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, FileText, FileUp, Loader2, Upload, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import Markdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { cn } from '@/utils/Helpers';

// =============================================================================
// Types
// =============================================================================

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

// =============================================================================
// Component
// =============================================================================

/**
 * Essay content input with two modes:
 * - Paste mode: Editable textarea with proportional font for manual input
 * - Upload mode: Read-only formatted markdown preview for uploaded documents
 */
export function EssayContentInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useDocumentUpload();

  const isProcessing = upload.state === 'uploading' || upload.state === 'processing';
  const hasError = upload.state === 'error';
  const isUploadMode = uploadedFileName !== null;

  // ---------------------------------------------------------------------------
  // Drag & Drop Handlers
  // ---------------------------------------------------------------------------

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
          setUploadedFileName(result.fileName);
          upload.reset();
        }
      }
    },
    [disabled, isProcessing, upload, onChange],
  );

  // ---------------------------------------------------------------------------
  // File Selection Handler
  // ---------------------------------------------------------------------------

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const result = await upload.upload(file);
        if (result) {
          onChange(result.markdown);
          setUploadedFileName(result.fileName);
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

  // ---------------------------------------------------------------------------
  // Mode Switching
  // ---------------------------------------------------------------------------

  const handleClearUpload = () => {
    setUploadedFileName(null);
    onChange('');
  };

  const handleClearError = () => {
    upload.reset();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload document"
        disabled={disabled || isProcessing}
      />

      {/* Main content area */}
      <div
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploadMode
          ? (
              // Upload mode: Read-only formatted preview
              <div
                className={cn(
                  'rounded-md border bg-card',
                  isDragging && 'border-primary ring-2 ring-primary/20',
                  className,
                )}
              >
                {/* File header */}
                <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="font-medium">{uploadedFileName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleBrowseClick}
                      disabled={disabled || isProcessing}
                      className="h-7 px-2 text-xs"
                    >
                      <FileUp className="mr-1 size-3" />
                      Re-upload
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearUpload}
                      disabled={disabled || isProcessing}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3.5" />
                      <span className="sr-only">Clear upload</span>
                    </Button>
                  </div>
                </div>

                {/* Formatted content preview */}
                <div className="max-h-[500px] min-h-[400px] overflow-y-auto p-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Markdown>{value}</Markdown>
                  </div>
                </div>
              </div>
            )
          : (
              // Paste mode: Editable textarea
              <>
                <Textarea
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  disabled={disabled || isProcessing}
                  placeholder={placeholder}
                  className={cn(
                    'min-h-[400px] resize-y text-base leading-relaxed',
                    // Proportional font for paste mode (not monospace)
                    'font-sans',
                    isDragging && 'border-primary bg-primary/5 ring-2 ring-primary/20',
                    isProcessing && 'opacity-50',
                    className,
                  )}
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
                  aria-label="Upload document"
                >
                  <FileUp className="size-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
              </>
            )}

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
