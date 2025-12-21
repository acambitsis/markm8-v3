import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAuthApi } from '@/libs/Auth';
import { db } from '@/libs/DB';
import { type AssignmentBrief, essays, type Rubric } from '@/models/Schema';

// Validation schema for draft updates (all fields optional for partial saves)
const draftSchema = z.object({
  assignmentBrief: z.object({
    title: z.string().max(200).optional(),
    instructions: z.string().max(10000).optional(),
    subject: z.string().max(100).optional(),
    academicLevel: z.enum(['high_school', 'undergraduate', 'postgraduate']).optional(),
  }).optional().nullable(),
  rubric: z.object({
    customCriteria: z.string().max(10000).optional(),
    focusAreas: z.array(z.string().max(100)).max(3).optional(),
  }).optional().nullable(),
  content: z.string().max(500000).optional().nullable(), // ~50k words max
  focusAreas: z.array(z.string().max(100)).max(3).optional().nullable(),
});

function countWords(text: string | null | undefined): number {
  if (!text) {
    return 0;
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function GET() {
  const { userId, error } = await requireAuthApi();

  if (error) {
    return error;
  }

  const result = await db
    .select()
    .from(essays)
    .where(and(eq(essays.userId, userId), eq(essays.status, 'draft')))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json(null);
  }

  return NextResponse.json(result[0]);
}

export async function POST(req: Request) {
  const { userId, error } = await requireAuthApi();

  if (error) {
    return error;
  }

  const body = await req.json();

  // Validate input
  const parseResult = draftSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const data = parseResult.data;

  // Check if user already has a draft
  const existingDraft = await db
    .select({ id: essays.id })
    .from(essays)
    .where(and(eq(essays.userId, userId), eq(essays.status, 'draft')))
    .limit(1);

  const wordCount = countWords(data.content);

  if (existingDraft.length > 0) {
    // Update existing draft
    const draftId = existingDraft[0]!.id;

    await db
      .update(essays)
      .set({
        assignmentBrief: data.assignmentBrief as AssignmentBrief | null,
        rubric: data.rubric as Rubric | null,
        content: data.content,
        wordCount,
        focusAreas: data.focusAreas,
        updatedAt: new Date(),
      })
      .where(eq(essays.id, draftId));

    // Return updated draft
    const updated = await db
      .select()
      .from(essays)
      .where(eq(essays.id, draftId))
      .limit(1);

    return NextResponse.json(updated[0]);
  } else {
    // Create new draft
    const inserted = await db
      .insert(essays)
      .values({
        userId,
        authorUserId: userId,
        assignmentBrief: data.assignmentBrief as AssignmentBrief | null,
        rubric: data.rubric as Rubric | null,
        content: data.content,
        wordCount,
        focusAreas: data.focusAreas,
        status: 'draft',
      })
      .returning();

    return NextResponse.json(inserted[0], { status: 201 });
  }
}
