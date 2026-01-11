import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import mammoth from 'mammoth';
import { NextResponse } from 'next/server';
import TurndownService from 'turndown';
// @ts-expect-error - no types available for this plugin
import { gfm } from 'turndown-plugin-gfm';

import { logger } from '@/libs/Logger';

/**
 * POST /api/parse-docx
 *
 * Parses a DOCX file and returns markdown content.
 * Uses mammoth.js for HTML extraction, then turndown for HTML-to-Markdown conversion.
 * No AI/API keys required - all processing is deterministic and local.
 */

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel Pro body limit is 4.5 MB)
const DOCX_MAGIC_BYTES = [0x50, 0x4B, 0x03, 0x04]; // PK (ZIP signature)

function errorResponse(error: string, message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error, message }, { status });
}

function isValidDocxFile(buffer: Buffer): boolean {
  const fileHeader = Array.from(new Uint8Array(buffer.slice(0, 4)));
  return DOCX_MAGIC_BYTES.every((b, i) => b === fileHeader[i]);
}

function calculateWordStats(text: string): { wordCount: number; preview: string } {
  const words = text.split(/\s+/).filter(Boolean);
  const preview = words.slice(0, 100).join(' ') + (words.length > 100 ? '...' : '');
  return { wordCount: words.length, preview };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Authenticate user via Clerk
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return errorResponse('UNAUTHORIZED', 'Please sign in to upload documents.', 401);
    }

    // Parse and validate file
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('NO_FILE', 'No file provided.', 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('FILE_TOO_LARGE', 'This file is over 4 MB. Try a shorter document or paste text directly.', 400);
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'docx') {
      return errorResponse('INVALID_FORMAT', 'This endpoint only accepts DOCX files.', 400);
    }

    // Read and validate file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidDocxFile(buffer)) {
      return errorResponse('INVALID_FILE', 'File appears to be corrupted or invalid.', 400);
    }

    // Extract HTML using mammoth
    const mammothResult = await mammoth.convertToHtml({ buffer });
    const html = mammothResult.value;

    if (!html || html.trim().length < 10) {
      return errorResponse('NO_TEXT_EXTRACTED', 'This document appears to be empty. Please paste your text.', 400);
    }

    // Convert HTML to markdown using turndown (deterministic, no AI needed)
    // GFM plugin adds support for tables, strikethrough, and task lists
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    turndownService.use(gfm);
    const markdown = turndownService.turndown(html).trim();

    if (!markdown) {
      return errorResponse('CONVERSION_FAILED', 'Failed to convert document. Please try again or paste text directly.', 500);
    }

    const { wordCount, preview } = calculateWordStats(markdown);

    return NextResponse.json({
      success: true,
      markdown,
      wordCount,
      preview,
      fileName: file.name,
      fileType: 'docx',
    });
  } catch (error) {
    logger.error(error, 'DOCX parsing error');
    return errorResponse('PARSE_FAILED', 'We couldn\'t read this file. Try uploading again or paste your text directly.', 500);
  }
}
