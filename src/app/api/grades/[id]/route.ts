import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { requireAuthApi } from '@/libs/Auth';
import { db } from '@/libs/DB';
import { essays, grades } from '@/models/Schema';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  const { userId, error } = await requireAuthApi();

  if (error) {
    return error;
  }

  const { id } = await params;

  // Fetch grade with user scope for security
  const result = await db
    .select({
      id: grades.id,
      essayId: grades.essayId,
      status: grades.status,
      letterGradeRange: grades.letterGradeRange,
      percentageRange: grades.percentageRange,
      feedback: grades.feedback,
      modelResults: grades.modelResults,
      errorMessage: grades.errorMessage,
      queuedAt: grades.queuedAt,
      startedAt: grades.startedAt,
      completedAt: grades.completedAt,
      createdAt: grades.createdAt,
    })
    .from(grades)
    .where(and(eq(grades.id, id), eq(grades.userId, userId)))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
  }

  const grade = result[0]!;

  // Also fetch essay info for context
  const essayResult = await db
    .select({
      id: essays.id,
      assignmentBrief: essays.assignmentBrief,
      wordCount: essays.wordCount,
      submittedAt: essays.submittedAt,
    })
    .from(essays)
    .where(eq(essays.id, grade.essayId))
    .limit(1);

  return NextResponse.json({
    ...grade,
    essay: essayResult[0] ?? null,
  });
}
