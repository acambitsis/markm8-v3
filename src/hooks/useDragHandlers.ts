'use client';

import type React from 'react';
import { useCallback } from 'react';

/**
 * Shared drag-and-drop event handlers for file upload components.
 * Handles dragover and dragleave events with proper state management.
 */
export function useDragHandlers(
  disabled: boolean,
  isProcessing: boolean,
  setIsDragging: (value: boolean) => void,
) {
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isProcessing) {
        setIsDragging(true);
      }
    },
    [disabled, isProcessing, setIsDragging],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    [setIsDragging],
  );

  return { handleDragOver, handleDragLeave };
}
