import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAuthApi } from '@/libs/Auth';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';

// Validation schema for profile updates
const updateProfileSchema = z.object({
  institution: z.string().max(200).optional().nullable(),
  course: z.string().max(200).optional().nullable(),
  defaultGradingScale: z.enum(['percentage', 'letter', 'uk', 'gpa', 'pass_fail']).optional().nullable(),
});

export async function GET() {
  const { userId, error } = await requireAuthApi();

  if (error) {
    return error;
  }

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      imageUrl: users.imageUrl,
      institution: users.institution,
      course: users.course,
      defaultGradingScale: users.defaultGradingScale,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function PATCH(req: Request) {
  const { userId, error } = await requireAuthApi();

  if (error) {
    return error;
  }

  const body = await req.json();

  // Validate input
  const parseResult = updateProfileSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const updates = parseResult.data;

  // Build update object with only provided fields
  const updateData: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (updates.institution !== undefined) {
    updateData.institution = updates.institution;
  }
  if (updates.course !== undefined) {
    updateData.course = updates.course;
  }
  if (updates.defaultGradingScale !== undefined) {
    updateData.defaultGradingScale = updates.defaultGradingScale;
  }

  await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId));

  // Return updated profile
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      imageUrl: users.imageUrl,
      institution: users.institution,
      course: users.course,
      defaultGradingScale: users.defaultGradingScale,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return NextResponse.json(result[0]);
}
