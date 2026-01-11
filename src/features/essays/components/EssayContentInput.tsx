'use client';

import { FileUp, Lock, Type, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import Markdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DragOverlay,
  ProcessingOverlay,
  UploadDropZone,
  UploadError,
} from '@/components/ui/upload-primitives';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useDragHandlers } from '@/hooks/useDragHandlers';
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
 * Essay content input with three modes:
 * - Empty state: Prominent upload zone with paste option
 * - Upload mode: Read-only formatted markdown preview for uploaded documents
 * - Typing mode: Editable textarea with proportional font for manual input
 */
export function EssayContentInput({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
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

  const { handleDragOver, handleDragLeave } = useDragHandlers(
    disabled,
    isProcessing,
    setIsDragging,
  );

  // ---------------------------------------------------------------------------
  // File Handlers
  // ---------------------------------------------------------------------------

  const processFile = useCallback(
    async (file: File) => {
      const result = await upload.upload(file);
      if (result) {
        onChange(result.markdown);
        setUploadedFileName(result.fileName);
        upload.reset();
      }
    },
    [upload, onChange],
  );

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
        await processFile(file);
      }
    },
    [disabled, isProcessing, processFile],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await processFile(file);
      }
      // Reset input for re-selection
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [processFile],
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

  const handleSwitchToTyping = () => {
    setIsTypingMode(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
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

                <DragOverlay isDragging={isDragging} />
                <ProcessingOverlay isProcessing={isProcessing} state={upload.state} />
              </div>
            )
          : showEmptyState
            ? (
                // Empty state: Prominent upload zone with paste option
                <div className="relative">
                  <UploadDropZone
                    icon={FileUp}
                    title="Drop your essay here"
                    subtitle="PDF, Word, or text files supported"
                    buttonLabel="Choose File"
                    onBrowse={handleBrowseClick}
                    onAlternative={handleSwitchToTyping}
                    alternativeIcon={Type}
                    alternativeLabel="Paste or type"
                    alternativeDescription="Write directly in the editor"
                    isDragging={isDragging}
                    isProcessing={isProcessing}
                    disabled={disabled}
                    minHeight="min-h-[400px]"
                    className={className}
                  />
                  <DragOverlay isDragging={isDragging} />
                  <ProcessingOverlay isProcessing={isProcessing} state={upload.state} />
                </div>
              )
            : (
                // Typing mode: Editable textarea with upload option
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
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

                  <DragOverlay isDragging={isDragging} />
                  <ProcessingOverlay isProcessing={isProcessing} state={upload.state} />
                </div>
              )}
      </div>

      <UploadError error={hasError ? upload.error : null} onDismiss={() => upload.reset()} />
    </div>
  );
}
