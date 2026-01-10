'use client';

import { useAction, useMutation } from 'convex/react';
import { useCallback, useState } from 'react';

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

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (aligned with Vercel Pro body limit)

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt'];

// =============================================================================
// Hook
// =============================================================================

type ParseResponse = {
  success: boolean;
  error?: string;
  message?: string;
  markdown?: string;
  wordCount?: number;
  preview?: string;
  fileName?: string;
  fileType?: 'pdf' | 'docx' | 'txt';
};

export function useDocumentUpload() {
  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<UploadError | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const parseDocument = useAction(api.documents.parseDocument);

  /**
   * Process parse response and update state
   * Returns the upload result on success, null on failure
   */
  const handleParseResponse = useCallback(
    (parseResult: ParseResponse): UploadResult | null => {
      if (!parseResult.success) {
        setError({ code: parseResult.error ?? 'UNKNOWN', message: parseResult.message ?? 'Unknown error' });
        setState('error');
        return null;
      }

      const uploadResult: UploadResult = {
        markdown: parseResult.markdown!,
        wordCount: parseResult.wordCount!,
        preview: parseResult.preview!,
        fileName: parseResult.fileName!,
        fileType: parseResult.fileType!,
      };

      setResult(uploadResult);
      setState('success');
      return uploadResult;
    },
    [],
  );

  /**
   * Upload and parse a DOCX file via Next.js API route
   * (mammoth.js can't run in Convex due to eval restrictions)
   */
  const uploadDocxViaApi = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setState('uploading');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-docx', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse document');
      }

      setState('processing');

      const parseResult = await response.json();
      return handleParseResponse(parseResult);
    },
    [handleParseResponse],
  );

  /**
   * Upload and parse a PDF/TXT file via Convex
   */
  const uploadViaConvex = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setState('uploading');

      const uploadUrl = await generateUploadUrl();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const { storageId } = await uploadResponse.json();

      setState('processing');

      const parseResult = await parseDocument({
        storageId,
        fileName: file.name,
      });

      return handleParseResponse(parseResult);
    },
    [generateUploadUrl, parseDocument, handleParseResponse],
  );

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
            message: 'This file is over 4 MB. Try a shorter document or paste text directly.',
          };
          setError(err);
          setState('error');
          return null;
        }

        // Check MIME type AND extension (defense in depth)
        const ext = file.name.split('.').pop()?.toLowerCase();
        const hasValidMimeType = ALLOWED_TYPES.includes(file.type);
        const hasValidExtension = ext && ALLOWED_EXTENSIONS.includes(ext);
        if (!hasValidMimeType && !hasValidExtension) {
          const err: UploadError = {
            code: 'UNSUPPORTED_FORMAT',
            message: 'We support Word (.docx), PDF, and text files.',
          };
          setError(err);
          setState('error');
          return null;
        }

        // Route DOCX files to Next.js API (mammoth can't run in Convex)
        // Route PDF/TXT files to Convex action
        if (ext === 'docx') {
          return await uploadDocxViaApi(file);
        }
        return await uploadViaConvex(file);
      } catch {
        // Error is handled and shown to user - no logging needed in client code
        const uploadError: UploadError = {
          code: 'UPLOAD_FAILED',
          message: 'We couldn\'t upload this file. Please try again.',
        };
        setError(uploadError);
        setState('error');
        return null;
      }
    },
    [uploadDocxViaApi, uploadViaConvex],
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
