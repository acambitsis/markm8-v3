import { and, desc, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { requireAuthApi } from '@/libs/Auth';
import { db } from '@/libs/DB';
import { essays, grades } from '@/models/Schema';

export async function GET() {
  const { userId, error } = await requireAuthApi();

  if (error) {
    return error;
  }

  // Get most recent 5 submitted essays with their latest grade
  const result = await db
    .select({
      id: essays.id,
      assignmentBrief: essays.assignmentBrief,
      submittedAt: essays.submittedAt,
      gradeId: grades.id,
      gradeStatus: grades.status,
      letterGradeRange: grades.letterGradeRange,
    })
    .from(essays)
    .leftJoin(grades, eq(grades.essayId, essays.id))
    .where(
      and(
        eq(essays.userId, userId),
        eq(essays.status, 'submitted'),
        isNull(essays.deletedAt),
      ),
    )
    .orderBy(desc(essays.submittedAt))
    .limit(5);

  // Transform to expected format
  const essaysWithGrades = result.map(row => ({
    id: row.id,
    assignmentBrief: row.assignmentBrief,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    grade: row.gradeId
      ? {
          id: row.gradeId,
          status: row.gradeStatus,
          letterGradeRange: row.letterGradeRange,
        }
      : null,
  }));

  return NextResponse.json({ essays: essaysWithGrades });
}
