// Document parsing for essay uploads
// Supports PDF and TXT files with Convex file storage
// DOCX files are handled by Next.js API route (mammoth can't run in Convex)

import { generateText } from 'ai';
import { v } from 'convex/values';

import { internal } from './_generated/api';
import { action, internalMutation, internalQuery, mutation } from './_generated/server';
import { getOpenRouterProvider } from './lib/ai';
import { requireAuth } from './lib/auth';

// =============================================================================
// Constants
// =============================================================================

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (consistent with client-side limit)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 documents per minute
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46]; // %PDF

// Supported MIME types (DOCX handled by Next.js API route)
const SUPPORTED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
} as const;

type FileType = (typeof SUPPORTED_MIME_TYPES)[keyof typeof SUPPORTED_MIME_TYPES];

// =============================================================================
// Error types
// =============================================================================

type ParseError = {
  success: false;
  error: string;
  message: string;
};

type ParseSuccess = {
  success: true;
  markdown: string;
  wordCount: number;
  preview: string;
  fileName: string;
  fileType: FileType;
};

type ParseResult = ParseError | ParseSuccess;

// =============================================================================
// Public Mutations
// =============================================================================

/**
 * Generate a signed URL for direct file upload to Convex storage
 * Client uses this URL to POST the file directly
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// =============================================================================
// Public Actions
// =============================================================================

/**
 * Parse an uploaded document and extract text as markdown
 * Supports PDF, DOCX, and TXT files
 */
export const parseDocument = action({
  args: {
    storageId: v.id('_storage'),
    fileName: v.string(),
  },
  handler: async (ctx, { storageId, fileName }): Promise<ParseResult> => {
    // 1. Auth check - get user from Clerk identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Please sign in to upload documents.',
      };
    }

    // Look up user by Clerk ID
    const user = await ctx.runQuery(internal.documents.getUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!user) {
      return {
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found. Please try signing out and back in.',
      };
    }

    const userId = user._id;

    // 2. Rate limit check
    const isAllowed = await ctx.runQuery(internal.documents.checkRateLimit, {
      userId,
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
    });

    if (!isAllowed) {
      return {
        success: false,
        error: 'RATE_LIMITED',
        message: 'Too many uploads. Please wait a minute and try again.',
      };
    }

    // 3. Get file from storage
    const blob = await ctx.storage.get(storageId);
    if (!blob) {
      return {
        success: false,
        error: 'FILE_NOT_FOUND',
        message: 'File not found. Please try uploading again.',
      };
    }

    // 4. Validate file size
    if (blob.size > MAX_FILE_SIZE) {
      // Clean up the file
      await ctx.storage.delete(storageId);
      return {
        success: false,
        error: 'FILE_TOO_LARGE',
        message: 'This file is over 4 MB. Try a shorter document or paste text directly.',
      };
    }

    // 5. Determine file type from content type or filename
    const contentType = blob.type;
    let fileType = SUPPORTED_MIME_TYPES[contentType as keyof typeof SUPPORTED_MIME_TYPES];

    // Fallback to extension if MIME type not recognized
    if (!fileType) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        fileType = 'pdf';
      } else if (ext === 'txt') {
        fileType = 'txt';
      }
    }

    if (!fileType) {
      await ctx.storage.delete(storageId);
      return {
        success: false,
        error: 'UNSUPPORTED_FORMAT',
        message: 'PDF and text files only. For Word documents, please use DOCX format.',
      };
    }

    // 6. Read file as Uint8Array (for binary) or text
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 7. Validate magic bytes for PDF
    if (fileType === 'pdf') {
      const fileHeader = Array.from(uint8Array.slice(0, PDF_MAGIC_BYTES.length));
      const isValid = PDF_MAGIC_BYTES.every((b, i) => b === fileHeader[i]);
      if (!isValid) {
        await ctx.storage.delete(storageId);
        return {
          success: false,
          error: 'INVALID_FILE',
          message: 'File appears to be corrupted or invalid.',
        };
      }
    }

    // 8. Record request for rate limiting
    await ctx.runMutation(internal.documents.recordRequest, { userId });

    // 9. Parse based on file type
    try {
      let markdown: string;

      if (fileType === 'txt') {
        markdown = await blob.text();
      } else {
        markdown = await parsePdf(uint8Array);
      }

      // 10. Clean up the uploaded file
      await ctx.storage.delete(storageId);

      // 11. Validate extracted content
      const trimmedMarkdown = markdown.trim();
      if (!trimmedMarkdown) {
        return {
          success: false,
          error: 'NO_TEXT_EXTRACTED',
          message: 'This document appears to be empty. Please paste your text.',
        };
      }

      // 12. Calculate word count and preview
      const words = trimmedMarkdown.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const preview = words.slice(0, 100).join(' ') + (words.length > 100 ? '...' : '');

      return {
        success: true,
        markdown: trimmedMarkdown,
        wordCount,
        preview,
        fileName,
        fileType,
      };
    } catch {
      // Clean up the file on error
      try {
        await ctx.storage.delete(storageId);
      } catch {
        // Ignore cleanup errors
      }

      // Convex auto-logs exceptions, no need for console.error
      return {
        success: false,
        error: 'PARSE_FAILED',
        message: 'We couldn\'t read this file. Try uploading again or paste your text directly.',
      };
    }
  },
});

// =============================================================================
// Internal Functions
// =============================================================================

/**
 * Get user by Clerk ID (for actions that can't access ctx.db directly)
 */
export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', q => q.eq('clerkId', clerkId))
      .unique();
  },
});

/**
 * Check if user is within rate limit
 */
export const checkRateLimit = internalQuery({
  args: {
    userId: v.id('users'),
    windowMs: v.number(),
    maxRequests: v.number(),
  },
  handler: async (ctx, { userId, windowMs, maxRequests }): Promise<boolean> => {
    const windowStart = Date.now() - windowMs;

    // Use .take() to stop early once we know user is over limit
    const recentRequests = await ctx.db
      .query('documentParseRequests')
      .withIndex('by_user_timestamp', q =>
        q.eq('userId', userId).gte('timestamp', windowStart))
      .take(maxRequests + 1);

    return recentRequests.length < maxRequests;
  },
});

/**
 * Record a parse request for rate limiting
 */
export const recordRequest = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    await ctx.db.insert('documentParseRequests', {
      userId,
      timestamp: Date.now(),
    });
  },
});

/**
 * Clean up old parse requests (older than 1 hour)
 * Called by cron job to prevent table bloat
 */
export const cleanupOldRequests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    // Query old records (no user filter needed, just by timestamp)
    // We'll delete in batches to avoid timeout
    const oldRequests = await ctx.db
      .query('documentParseRequests')
      .filter(q => q.lt(q.field('timestamp'), oneHourAgo))
      .take(100);

    for (const request of oldRequests) {
      await ctx.db.delete(request._id);
    }

    return { deleted: oldRequests.length };
  },
});

// =============================================================================
// Parsing Helpers
// =============================================================================

/**
 * Parse PDF using OpenRouter with Gemini native PDF support
 */
async function parsePdf(data: Uint8Array): Promise<string> {
  const provider = getOpenRouterProvider();
  const model = provider('google/gemini-3-flash-preview');

  const response = await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract all text content from this PDF document and convert it to clean markdown format.

Rules:
- Preserve the document structure (headings, paragraphs, lists)
- Convert tables to markdown table format
- Remove any headers, footers, or page numbers
- Do not add any commentary or analysis
- Output ONLY the extracted markdown content`,
          },
          {
            type: 'file',
            data,
            mediaType: 'application/pdf',
          },
        ],
      },
    ],
    temperature: 0.1,
  });

  return response.text;
}
