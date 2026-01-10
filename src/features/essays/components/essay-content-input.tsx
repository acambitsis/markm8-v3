'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, FileUp, Loader2, Lock, Type, Upload, X } from 'lucide-react';
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
  const [isTypingMode, setIsTypingMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const upload = useDocumentUpload();

  const isProcessing = upload.state === 'uploading' || upload.state === 'processing';
  const hasError = upload.state === 'error';
  const isUploadMode = uploadedFileName !== null;
  const showEmptyState = !isUploadMode && !isTypingMode && value.length === 0;

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
                    <Lock className="size-4 text-muted-foreground" />
                    <span className="font-medium">{uploadedFileName}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      Read-only
                    </span>
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

                {/* Formatted content preview - skipHtml for XSS protection */}
                <div className="max-h-[500px] min-h-[400px] cursor-default overflow-y-auto p-6">
                  <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-foreground/70">
                    <Markdown skipHtml>{value}</Markdown>
                  </div>
                </div>
              </div>
            )
          : showEmptyState
            ? (
                // Empty state: Prominent upload zone with paste option
                <div
                  className={cn(
                    'relative min-h-[400px] rounded-lg border-2 border-dashed',
                    'flex flex-col items-center justify-center gap-6 p-8',
                    'transition-all duration-200',
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/40',
                    isProcessing && 'pointer-events-none opacity-50',
                    className,
                  )}
                >
                  {/* Upload section */}
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="rounded-full bg-primary/10 p-4">
                      <FileUp className="size-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Drop your essay here
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        PDF, Word, or text files supported
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      onClick={handleBrowseClick}
                      disabled={disabled || isProcessing}
                      className="mt-2 gap-2"
                    >
                      <Upload className="size-4" />
                      Choose File
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="flex w-full max-w-xs items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      or
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Paste option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsTypingMode(true);
                      // Focus the textarea after it renders
                      setTimeout(() => textareaRef.current?.focus(), 50);
                    }}
                    disabled={disabled || isProcessing}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 px-6 py-3',
                      'transition-all hover:border-border hover:bg-background hover:shadow-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    )}
                  >
                    <div className="rounded-md bg-muted p-2 transition-colors group-hover:bg-muted/80">
                      <Type className="size-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Paste or type</p>
                      <p className="text-xs text-muted-foreground">Write directly in the editor</p>
                    </div>
                  </button>
                </div>
              )
            : (
                // Has content or typing mode: Editable textarea with upload option
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onBlur={() => {
                      // Return to empty state if user leaves without typing
                      if (value.length === 0) {
                        setIsTypingMode(false);
                      }
                    }}
                    disabled={disabled || isProcessing}
                    placeholder={placeholder}
                    className={cn(
                      'min-h-[400px] resize-y text-base leading-relaxed',
                      'font-sans',
                      isDragging && 'border-primary bg-primary/5 ring-2 ring-primary/20',
                      isProcessing && 'opacity-50',
                      className,
                    )}
                  />

                  {/* Floating toolbar */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleBrowseClick}
                      disabled={disabled || isProcessing}
                      className="h-8 gap-1.5 text-xs shadow-sm"
                    >
                      <FileUp className="size-3.5" />
                      Replace with file
                    </Button>
                  </div>
                </div>
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
