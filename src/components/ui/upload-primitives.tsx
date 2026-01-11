'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { UploadState } from '@/hooks/useDocumentUpload';
import { cn } from '@/utils/Helpers';

// =============================================================================
// UploadDropZone - Empty state with prominent upload CTA
// =============================================================================

type UploadDropZoneProps = {
  /** Icon to display in the drop zone */
  icon: LucideIcon;
  /** Main heading text */
  title: string;
  /** Subtext below the heading */
  subtitle: string;
  /** Label for the primary upload button */
  buttonLabel: string;
  /** Handler for browse button click */
  onBrowse: (e: React.MouseEvent) => void;
  /** Handler for alternative action (e.g., "type directly") */
  onAlternative?: () => void;
  /** Icon for alternative action */
  alternativeIcon?: LucideIcon;
  /** Label for alternative action */
  alternativeLabel?: string;
  /** Description for alternative action */
  alternativeDescription?: string;
  /** Whether user is dragging over the zone */
  isDragging?: boolean;
  /** Whether upload is processing */
  isProcessing?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Minimum height of the zone */
  minHeight?: string;
  /** Additional class names */
  className?: string;
};

export function UploadDropZone({
  icon: Icon,
  title,
  subtitle,
  buttonLabel,
  onBrowse,
  onAlternative,
  alternativeIcon: AlternativeIcon,
  alternativeLabel,
  alternativeDescription,
  isDragging = false,
  isProcessing = false,
  disabled = false,
  minHeight = 'min-h-[200px]',
  className,
}: UploadDropZoneProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed',
        'flex flex-col items-center justify-center gap-4 p-6',
        'transition-all duration-200',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/40',
        isProcessing && 'pointer-events-none opacity-50',
        minHeight,
        className,
      )}
    >
      {/* Upload section */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className="size-6 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button
          type="button"
          variant="default"
          size="default"
          onClick={onBrowse}
          disabled={disabled || isProcessing}
          className="gap-2"
        >
          <Upload className="size-4" />
          {buttonLabel}
        </Button>
      </div>

      {/* Divider and alternative action */}
      {onAlternative && alternativeLabel && (
        <>
          <div className="flex w-full max-w-[200px] items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={onAlternative}
            disabled={disabled || isProcessing}
            className={cn(
              'group flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/50 px-4 py-2.5',
              'transition-all hover:border-border hover:bg-background hover:shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            )}
          >
            {AlternativeIcon && (
              <div className="rounded-md bg-muted p-1.5 transition-colors group-hover:bg-muted/80">
                <AlternativeIcon className="size-4 text-muted-foreground" />
              </div>
            )}
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{alternativeLabel}</p>
              {alternativeDescription && (
                <p className="text-xs text-muted-foreground">{alternativeDescription}</p>
              )}
            </div>
          </button>
        </>
      )}
    </div>
  );
}

// =============================================================================
// DragOverlay - Shown when user drags file over drop zone
// =============================================================================

type DragOverlayProps = {
  isDragging: boolean;
  label?: string;
};

export function DragOverlay({ isDragging, label = 'Drop file here' }: DragOverlayProps) {
  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/10"
        >
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="size-8" />
            <p className="text-sm font-medium">{label}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// ProcessingOverlay - Shown during file upload/processing
// =============================================================================

type ProcessingOverlayProps = {
  isProcessing: boolean;
  state: UploadState;
};

export function ProcessingOverlay({ isProcessing, state }: ProcessingOverlayProps) {
  return (
    <AnimatePresence>
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <div>
              <p className="font-medium">
                {state === 'uploading' ? 'Uploading...' : 'Processing document...'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {state === 'processing' ? 'Extracting text (2-5 seconds)' : 'Please wait'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// UploadError - Error message with dismiss button
// =============================================================================

type UploadErrorProps = {
  error: { message: string } | null;
  onDismiss: () => void;
};

export function UploadError({ error, onDismiss }: UploadErrorProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3"
        >
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{error.message}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="mt-1 text-xs text-muted-foreground underline hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
