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

// Format-specific file size limits
// DOCX: 4 MB (Vercel API route body limit)
// PDF/TXT: 10 MB (Convex storage, no Vercel limit)
const FILE_SIZE_LIMITS = {
  docx: { bytes: 4 * 1024 * 1024, label: '4 MB' },
  default: { bytes: 10 * 1024 * 1024, label: '10 MB' },
} as const;

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt'];

function getFileSizeLimit(ext: string | undefined): { bytes: number; label: string } {
  return ext === 'docx' ? FILE_SIZE_LIMITS.docx : FILE_SIZE_LIMITS.default;
}

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

      setState('processing');

      // API always returns JSON with { success, error?, message? }
      // Let handleParseResponse handle both success and error cases
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
        // Get file extension for format-specific validation
        const ext = file.name.split('.').pop()?.toLowerCase();

        // Check MIME type AND extension (defense in depth)
        const hasValidMimeType = ALLOWED_TYPES.includes(file.type);
        const hasValidExtension = ext && ALLOWED_EXTENSIONS.includes(ext);
        if (!hasValidMimeType && !hasValidExtension) {
          setError({
            code: 'UNSUPPORTED_FORMAT',
            message: 'We support Word (.docx), PDF, and text files.',
          });
          setState('error');
          return null;
        }

        // Format-specific file size validation
        const sizeLimit = getFileSizeLimit(ext);
        if (file.size > sizeLimit.bytes) {
          setError({
            code: 'FILE_TOO_LARGE',
            message: `This file is over ${sizeLimit.label}. Try a shorter document or paste text directly.`,
          });
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
        setError({
          code: 'UPLOAD_FAILED',
          message: 'We couldn\'t upload this file. Please try again.',
        });
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
