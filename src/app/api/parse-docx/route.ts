import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import mammoth from 'mammoth';
import { NextResponse } from 'next/server';

import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';

/**
 * POST /api/parse-docx
 *
 * Parses a DOCX file and returns markdown content.
 * Uses mammoth.js for HTML extraction, then Gemini Flash for HTML→Markdown conversion.
 *
 * Request: FormData with 'file' field containing the DOCX file
 * Response: { success: true, markdown, wordCount, preview } on success
 *           { success: false, error, message } on failure
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  try {
    // 1. Authenticate user via Clerk
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Please sign in to upload documents.' },
        { status: 401 },
      );
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'NO_FILE', message: 'No file provided.' },
        { status: 400 },
      );
    }

    // 3. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'FILE_TOO_LARGE', message: 'This file is over 10 MB. Try a shorter document or paste text directly.' },
        { status: 400 },
      );
    }

    // 4. Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'docx') {
      return NextResponse.json(
        { success: false, error: 'INVALID_FORMAT', message: 'This endpoint only accepts DOCX files.' },
        { status: 400 },
      );
    }

    // 5. Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Validate magic bytes (PK signature for ZIP/DOCX)
    const magicBytes = [0x50, 0x4B, 0x03, 0x04];
    const fileHeader = Array.from(new Uint8Array(buffer.slice(0, 4)));
    const isValidDocx = magicBytes.every((b, i) => b === fileHeader[i]);

    if (!isValidDocx) {
      return NextResponse.json(
        { success: false, error: 'INVALID_FILE', message: 'File appears to be corrupted or invalid.' },
        { status: 400 },
      );
    }

    // 7. Extract HTML using mammoth
    const mammothResult = await mammoth.convertToHtml({ buffer });
    const html = mammothResult.value;

    if (!html || html.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'NO_TEXT_EXTRACTED', message: 'This document appears to be empty. Please paste your text.' },
        { status: 400 },
      );
    }

    // 8. Convert HTML to markdown using Gemini Flash
    const openrouter = createOpenRouter({
      apiKey: Env.OPENROUTER_API_KEY,
    });
    const model = openrouter('google/gemini-3-flash-preview');

    const response = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: `Convert this HTML extracted from a Word document to clean markdown format.

Rules:
- Preserve the document structure (headings, paragraphs, lists)
- Convert HTML tables to markdown table format
- Remove any empty elements or unnecessary whitespace
- Do not add any commentary or analysis
- Output ONLY the converted markdown content

HTML content:
${html}`,
        },
      ],
      temperature: 0.1,
    });

    const markdown = response.text.trim();

    if (!markdown) {
      return NextResponse.json(
        { success: false, error: 'CONVERSION_FAILED', message: 'Failed to convert document. Please try again or paste text directly.' },
        { status: 500 },
      );
    }

    // 9. Calculate word count and preview
    const words = markdown.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const preview = words.slice(0, 100).join(' ') + (words.length > 100 ? '...' : '');

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
    return NextResponse.json(
      { success: false, error: 'PARSE_FAILED', message: 'We couldn\'t read this file. Try uploading again or paste your text directly.' },
      { status: 500 },
    );
  }
}
