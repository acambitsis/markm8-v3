import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { requireAuthApi } from '@/libs/Auth';
import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import {
  type AssignmentBrief,
  credits,
  creditTransactions,
  essays,
  type GradeFeedback,
  grades,
  type ModelResult,
  type PercentageRange,
} from '@/models/Schema';

const GRADING_COST = '1.00';

function countWords(text: string | null | undefined): number {
  if (!text) {
    return 0;
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Generate mock grading results for testing
function generateMockGrade(): {
  letterGradeRange: string;
  percentageRange: PercentageRange;
  feedback: GradeFeedback;
  modelResults: ModelResult[];
} {
  // Generate random percentage between 70-95
  const basePercentage = Math.floor(Math.random() * 26) + 70;
  const lowerBound = Math.max(0, basePercentage - 3);
  const upperBound = Math.min(100, basePercentage + 3);

  return {
    letterGradeRange: basePercentage >= 90 ? 'A' : basePercentage >= 80 ? 'B' : 'C',
    percentageRange: {
      lower: lowerBound,
      upper: upperBound,
    },
    feedback: {
      strengths: [
        {
          title: 'Clear Structure',
          description: 'Your essay follows a logical progression with well-defined sections.',
          evidence: 'The introduction clearly sets up the thesis and each paragraph builds on the previous.',
        },
        {
          title: 'Strong Evidence',
          description: 'You support your arguments with relevant examples and citations.',
          evidence: 'Multiple references to primary and secondary sources strengthen your analysis.',
        },
        {
          title: 'Engaging Writing Style',
          description: 'Your prose is readable and maintains reader interest throughout.',
        },
      ],
      improvements: [
        {
          title: 'Transition Clarity',
          description: 'Some paragraph transitions could be smoother.',
          suggestion: 'Use transitional phrases to connect ideas between paragraphs.',
          detailedSuggestions: [
            'Add "Furthermore" or "In addition" when introducing supporting points',
            'Use "However" or "Conversely" for contrasting ideas',
            'Reference previous paragraphs: "Building on this point..."',
          ],
        },
        {
          title: 'Conclusion Depth',
          description: 'The conclusion could more effectively synthesize your arguments.',
          suggestion: 'Rather than summarizing, show how your points connect to form a larger insight.',
        },
      ],
      languageTips: [
        {
          category: 'Academic Tone',
          feedback: 'Consider avoiding contractions in formal academic writing.',
        },
        {
          category: 'Vocabulary',
          feedback: 'Vary your word choice to avoid repetition of key terms.',
        },
      ],
      resources: [
        {
          title: 'Purdue OWL - Transitions',
          url: 'https://owl.purdue.edu/owl/general_writing/mechanics/transitions_and_transitional_devices/',
          description: 'Comprehensive guide on using transitional phrases effectively.',
        },
      ],
    },
    modelResults: [
      { model: 'grok-4', percentage: basePercentage - 2, included: true },
      { model: 'grok-4', percentage: basePercentage, included: true },
      { model: 'grok-4', percentage: basePercentage + 2, included: true },
    ],
  };
}

export async function POST() {
  const { userId, error } = await requireAuthApi();

  if (error) {
    return error;
  }

  // 1. Get user's current draft
  const draftResult = await db
    .select()
    .from(essays)
    .where(and(eq(essays.userId, userId), eq(essays.status, 'draft')))
    .limit(1);

  if (draftResult.length === 0) {
    return NextResponse.json({ error: 'No draft found to submit' }, { status: 404 });
  }

  const draft = draftResult[0]!;
  const assignmentBrief = draft.assignmentBrief as AssignmentBrief | null;

  // 2. Validate required fields
  const errors: string[] = [];

  if (!assignmentBrief?.title || assignmentBrief.title.length === 0) {
    errors.push('Title is required');
  }
  if (!assignmentBrief?.instructions || assignmentBrief.instructions.length === 0) {
    errors.push('Instructions are required');
  }
  if (!assignmentBrief?.subject || assignmentBrief.subject.length === 0) {
    errors.push('Subject is required');
  }
  if (!draft.content || draft.content.length === 0) {
    errors.push('Essay content is required');
  }

  const wordCount = countWords(draft.content);
  if (wordCount < 50) {
    errors.push(`Essay must be at least 50 words. Current: ${wordCount} words`);
  }
  if (wordCount > 50000) {
    errors.push(`Essay exceeds 50,000 word limit. Current: ${wordCount} words`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  // 3. Check credit balance
  const creditResult = await db
    .select({ balance: credits.balance, reserved: credits.reserved })
    .from(credits)
    .where(eq(credits.userId, userId))
    .limit(1);

  if (creditResult.length === 0) {
    return NextResponse.json(
      { error: 'No credits found. Please contact support.' },
      { status: 400 },
    );
  }

  const balance = Number.parseFloat(creditResult[0]!.balance);
  const reserved = Number.parseFloat(creditResult[0]!.reserved);
  const available = balance - reserved;

  if (available < 1.0) {
    return NextResponse.json(
      {
        error: `Insufficient credits. You need 1.00 credits but only have ${available.toFixed(2)} available.`,
      },
      { status: 400 },
    );
  }

  try {
    // Wrap all operations in a transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // 4. Reserve credit (balance - 1.00, reserved + 1.00)
      await tx
        .update(credits)
        .set({
          balance: sql`${credits.balance} - ${GRADING_COST}`,
          reserved: sql`${credits.reserved} + ${GRADING_COST}`,
          updatedAt: new Date(),
        })
        .where(eq(credits.userId, userId));

      // 5. Update essay status to 'submitted'
      await tx
        .update(essays)
        .set({
          status: 'submitted',
          submittedAt: new Date(),
          updatedAt: new Date(),
          wordCount,
        })
        .where(eq(essays.id, draft.id));

      // 6. Create grade record
      const gradeInsert = await tx
        .insert(grades)
        .values({
          userId,
          essayId: draft.id,
          status: 'queued',
          queuedAt: new Date(),
        })
        .returning();

      const gradeId = gradeInsert[0]!.id;

      // 7. MOCK GRADING: Immediately simulate completion
      // This will be removed when the worker is implemented
      const mockGrade = generateMockGrade();

      await tx
        .update(grades)
        .set({
          status: 'complete',
          letterGradeRange: mockGrade.letterGradeRange,
          percentageRange: mockGrade.percentageRange,
          feedback: mockGrade.feedback,
          modelResults: mockGrade.modelResults,
          startedAt: new Date(),
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(grades.id, gradeId));

      // 8. Clear reservation (reserved - 1.00)
      // Credit was already deducted from balance, just clear the reservation
      await tx
        .update(credits)
        .set({
          reserved: sql`${credits.reserved} - ${GRADING_COST}`,
          updatedAt: new Date(),
        })
        .where(eq(credits.userId, userId));

      // 9. Record the transaction
      await tx.insert(creditTransactions).values({
        userId,
        amount: `-${GRADING_COST}`,
        transactionType: 'grading',
        description: `Grading for essay: ${assignmentBrief?.title}`,
        gradeId,
      });

      return gradeId;
    });

    const gradeId = result;

    logger.info('Essay submitted and graded (mock)', {
      userId,
      essayId: draft.id,
      gradeId,
      wordCount,
    });

    return NextResponse.json({
      essayId: draft.id,
      gradeId,
    });
  } catch (err) {
    logger.error('Error during essay submission', { error: err, userId });

    return NextResponse.json(
      { error: 'Failed to submit essay. Please try again.' },
      { status: 500 },
    );
  }
}
