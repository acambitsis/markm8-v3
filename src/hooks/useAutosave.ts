'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type UseAutosaveOptions<T> = {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
};

export function useAutosave<T>({
  data,
  onSave,
  debounceMs = 1500,
  enabled = true,
}: UseAutosaveOptions<T>) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>('');

  // Serialize data for comparison
  const serializedData = JSON.stringify(data);

  const save = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setStatus('saving');
      await onSave(data);
      setStatus('saved');

      // Reset to idle after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    }
  }, [data, onSave, enabled]);

  // Save immediately (for blur events)
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    save();
  }, [save]);

  // Cancel pending save (for clear/reset operations)
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Update ref so next data change is seen as "no change" initially
    previousDataRef.current = '';
  }, []);

  // Debounced save
  useEffect(() => {
    // Skip if data hasn't changed
    if (serializedData === previousDataRef.current) {
      return;
    }
    previousDataRef.current = serializedData;

    if (!enabled) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [serializedData, save, debounceMs, enabled]);

  // Save on window blur
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleBlur = () => {
      if (serializedData !== previousDataRef.current) {
        saveNow();
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [saveNow, serializedData, enabled]);

  return {
    status,
    saveNow,
    cancel,
  };
}
