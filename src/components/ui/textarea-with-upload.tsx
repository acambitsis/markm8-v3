'use client';

import { FileUp, Type } from 'lucide-react';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';

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

type TextareaProps = React.ComponentProps<'textarea'>;

type Props = Omit<TextareaProps, 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
  /** Label for the upload button (accessibility) */
  uploadLabel?: string;
  /** Title shown in empty state drop zone */
  dropZoneTitle?: string;
  /** Subtitle shown in empty state drop zone */
  dropZoneSubtitle?: string;
  /** Minimum height for the component */
  minHeight?: string;
};

// =============================================================================
// Component
// =============================================================================

/**
 * A textarea with two modes:
 * - Empty state: Prominent drop zone with upload CTA (consistent with EssayContentInput)
 * - Has content: Editable textarea with upload button in corner
 *
 * Supports drag-and-drop or click-to-browse for PDF, DOCX, and TXT files.
 */
export function TextareaWithUpload({
  value,
  onChange,
  uploadLabel = 'Upload document',
  dropZoneTitle = 'Drop your document here',
  dropZoneSubtitle = 'PDF, Word, or text files supported',
  minHeight = 'min-h-[180px]',
  className,
  disabled = false,
  placeholder,
  ...textareaProps
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isTypingMode, setIsTypingMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const upload = useDocumentUpload();

  const isProcessing = upload.state === 'uploading' || upload.state === 'processing';
  const hasError = upload.state === 'error';
  const showEmptyState = !isTypingMode && value.length === 0;

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
        aria-label={uploadLabel}
        disabled={disabled || isProcessing}
      />

      {/* Main content area */}
      <div
        className="relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {showEmptyState
          ? (
              // Empty state: Prominent upload zone (consistent with EssayContentInput)
              <UploadDropZone
                icon={FileUp}
                title={dropZoneTitle}
                subtitle={dropZoneSubtitle}
                buttonLabel="Choose File"
                onBrowse={handleBrowseClick}
                onAlternative={handleSwitchToTyping}
                alternativeIcon={Type}
                alternativeLabel="Type directly"
                isDragging={isDragging}
                isProcessing={isProcessing}
                disabled={disabled}
                minHeight={minHeight}
                className={className}
              />
            )
          : (
              // Has content or typing mode: Editable textarea with upload option
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  disabled={disabled || isProcessing}
                  placeholder={placeholder}
                  className={cn(
                    'resize-y transition-all duration-200',
                    minHeight,
                    isDragging && 'border-primary bg-primary/5 ring-2 ring-primary/20',
                    isProcessing && 'opacity-50',
                    className,
                  )}
                  {...textareaProps}
                />

                {/* Upload button in corner - more visible than before */}
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  disabled={disabled || isProcessing}
                  className={cn(
                    'absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md px-2.5 py-1.5',
                    'border border-border/50 bg-background/90 text-xs font-medium text-muted-foreground',
                    'transition-all hover:border-primary/30 hover:bg-background hover:text-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    'disabled:pointer-events-none disabled:opacity-50',
                  )}
                  aria-label={uploadLabel}
                >
                  <FileUp className="size-3.5" />
                  <span className="hidden sm:inline">Upload</span>
                </button>

                <DragOverlay isDragging={isDragging} />
                <ProcessingOverlay isProcessing={isProcessing} state={upload.state} />
              </div>
            )}

        {/* Overlays for empty state */}
        {showEmptyState && (
          <>
            <DragOverlay isDragging={isDragging} />
            <ProcessingOverlay isProcessing={isProcessing} state={upload.state} />
          </>
        )}
      </div>

      <UploadError error={hasError ? upload.error : null} onDismiss={() => upload.reset()} />
    </div>
  );
}
