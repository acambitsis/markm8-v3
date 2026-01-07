'use client';

import { useAction, useMutation } from 'convex/react';
import { useCallback, useState } from 'react';

import { logger } from '@/libs/Logger';

import { api } from '../../convex/_generated/api';

// =============================================================================
// Types
// =============================================================================

export type UploadState =
  | 'idle'
  | 'drag-over'
  | 'uploading'
  | 'processing'
  | 'success'
  | 'error';

export type UploadError = {
  code: string;
  message: string;
};

export type UploadResult = {
  markdown: string;
  wordCount: number;
  preview: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt';
};

// =============================================================================
// Constants
// =============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt'];

// =============================================================================
// Hook
// =============================================================================

export function useDocumentUpload() {
  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<UploadError | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const parseDocument = useAction(api.documents.parseDocument);

  /**
   * Upload and parse a file
   */
  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setError(null);
      setResult(null);

      try {
        // Client-side validation
        if (file.size > MAX_FILE_SIZE) {
          const err: UploadError = {
            code: 'FILE_TOO_LARGE',
            message: 'This file is over 10 MB. Try a shorter document or paste text directly.',
          };
          setError(err);
          setState('error');
          return null;
        }

        // Check MIME type or extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ALLOWED_TYPES.includes(file.type) && (!ext || !ALLOWED_EXTENSIONS.includes(ext))) {
          const err: UploadError = {
            code: 'UNSUPPORTED_FORMAT',
            message: 'We support Word (.docx), PDF, and text files.',
          };
          setError(err);
          setState('error');
          return null;
        }

        // Start upload
        setState('uploading');

        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // Upload file directly to Convex storage
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const { storageId } = await uploadResponse.json();

        // Start processing
        setState('processing');

        // Parse the document
        const parseResult = await parseDocument({
          storageId,
          fileName: file.name,
        });

        if (!parseResult.success) {
          const err: UploadError = {
            code: parseResult.error,
            message: parseResult.message,
          };
          setError(err);
          setState('error');
          return null;
        }

        // Success
        const uploadResult: UploadResult = {
          markdown: parseResult.markdown,
          wordCount: parseResult.wordCount,
          preview: parseResult.preview,
          fileName: parseResult.fileName,
          fileType: parseResult.fileType,
        };

        setResult(uploadResult);
        setState('success');
        return uploadResult;
      } catch (err) {
        logger.error(err, 'Upload failed');
        const uploadError: UploadError = {
          code: 'UPLOAD_FAILED',
          message: 'We couldn\'t upload this file. Please try again.',
        };
        setError(uploadError);
        setState('error');
        return null;
      }
    },
    [generateUploadUrl, parseDocument],
  );

  /**
   * Reset state to idle
   */
  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setResult(null);
  }, []);

  /**
   * Set drag-over state
   */
  const setDragOver = useCallback(
    (isDragging: boolean) => {
      if (state === 'idle' || state === 'drag-over') {
        setState(isDragging ? 'drag-over' : 'idle');
      }
    },
    [state],
  );

  return {
    state,
    error,
    result,
    upload,
    reset,
    setDragOver,
  };
}
