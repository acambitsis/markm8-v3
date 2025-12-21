import { and, count, desc, eq, isNull, like } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { requireAuthApi } from '@/libs/Auth';
import { db } from '@/libs/DB';
import { essays, grades } from '@/models/Schema';

const PAGE_SIZE = 20;

export async function GET(req: Request) {
  const { userId, error } = await requireAuthApi();

  if (error) {
    return error;
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1'));
  const search = url.searchParams.get('search') ?? '';

  // Build base conditions
  const conditions = [
    eq(essays.userId, userId),
    eq(essays.status, 'submitted'),
    isNull(essays.deletedAt),
  ];

  // Add search filter if provided
  if (search) {
    conditions.push(like(essays.content, `%${search}%`));
  }

  // Get total count
  const countResult = await db
    .select({ count: count() })
    .from(essays)
    .where(and(...conditions));

  const total = countResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Get essays with their latest grade
  const result = await db
    .select({
      id: essays.id,
      assignmentBrief: essays.assignmentBrief,
      submittedAt: essays.submittedAt,
      wordCount: essays.wordCount,
      gradeId: grades.id,
      gradeStatus: grades.status,
      letterGradeRange: grades.letterGradeRange,
    })
    .from(essays)
    .leftJoin(grades, eq(grades.essayId, essays.id))
    .where(and(...conditions))
    .orderBy(desc(essays.submittedAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  // Transform to expected format
  const essaysWithGrades = result.map(row => ({
    id: row.id,
    assignmentBrief: row.assignmentBrief,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    wordCount: row.wordCount,
    grade: row.gradeId
      ? {
          id: row.gradeId,
          status: row.gradeStatus,
          letterGradeRange: row.letterGradeRange,
        }
      : null,
  }));

  return NextResponse.json({
    essays: essaysWithGrades,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
    },
  });
}
