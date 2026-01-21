import { describe, expect, it } from 'vitest';

import { stripCostData } from './grades';

// Mock grade data matching Doc<'grades'> structure
const createMockGrade = (overrides = {}) => ({
  _id: 'grade123' as any,
  _creationTime: 1700000000000,
  userId: 'user123' as any,
  essayId: 'essay123' as any,
  status: 'complete' as const,
  queuedAt: 1700000000000,
  startedAt: 1700000001000,
  completedAt: 1700000005000,
  percentageRange: { lower: 70, upper: 75 },
  feedback: {
    strengths: [{ title: 'Good thesis', description: 'Clear argument' }],
    improvements: [{ title: 'Citations', description: 'Add more', suggestion: 'Use APA' }],
    languageTips: [{ category: 'Grammar', feedback: 'Watch tense consistency' }],
  },
  categoryScores: {
    contentUnderstanding: 75,
    structureOrganization: 72,
    criticalAnalysis: 70,
    languageStyle: 78,
  },
  modelResults: [
    { model: 'gpt-4', percentage: 72, included: true, durationMs: 1500, cost: '0.0150' },
    { model: 'claude-3', percentage: 75, included: true, durationMs: 1200, cost: '0.0120' },
    { model: 'gemini', percentage: 70, included: true, durationMs: 1800, cost: '0.0100' },
  ],
  totalTokens: 5000,
  apiCost: '0.0370',
  ...overrides,
});

describe('stripCostData', () => {
  it('removes apiCost from grade', () => {
    const grade = createMockGrade();
    const result = stripCostData(grade);

    expect(result).not.toHaveProperty('apiCost');
  });

  it('removes totalTokens from grade', () => {
    const grade = createMockGrade();
    const result = stripCostData(grade);

    expect(result).not.toHaveProperty('totalTokens');
  });

  it('removes cost from each model result', () => {
    const grade = createMockGrade();
    const result = stripCostData(grade);

    expect(result.modelResults).toBeDefined();

    for (const modelResult of result.modelResults!) {
      expect(modelResult).not.toHaveProperty('cost');
    }
  });

  it('preserves non-cost fields in model results', () => {
    const grade = createMockGrade();
    const result = stripCostData(grade);

    expect(result.modelResults).toHaveLength(3);
    expect(result.modelResults![0]).toEqual({
      model: 'gpt-4',
      percentage: 72,
      included: true,
      durationMs: 1500,
    });
  });

  it('preserves all other grade fields', () => {
    const grade = createMockGrade();
    const result = stripCostData(grade);

    expect(result._id).toBe(grade._id);
    expect(result.userId).toBe(grade.userId);
    expect(result.essayId).toBe(grade.essayId);
    expect(result.status).toBe(grade.status);
    expect(result.percentageRange).toEqual(grade.percentageRange);
    expect(result.feedback).toEqual(grade.feedback);
    expect(result.categoryScores).toEqual(grade.categoryScores);
    expect(result.queuedAt).toBe(grade.queuedAt);
    expect(result.completedAt).toBe(grade.completedAt);
  });

  it('handles grade without modelResults', () => {
    const grade = createMockGrade({ modelResults: undefined });
    const result = stripCostData(grade);

    expect(result.modelResults).toBeUndefined();
  });

  it('handles grade without apiCost', () => {
    const grade = createMockGrade({ apiCost: undefined });
    const result = stripCostData(grade);

    expect(result).not.toHaveProperty('apiCost');
  });

  it('handles model results without cost field', () => {
    const grade = createMockGrade({
      modelResults: [
        { model: 'gpt-4', percentage: 72, included: true, durationMs: 1500 },
      ],
    });
    const result = stripCostData(grade);

    expect(result.modelResults).toHaveLength(1);
    expect(result.modelResults![0]).toEqual({
      model: 'gpt-4',
      percentage: 72,
      included: true,
      durationMs: 1500,
    });
  });
});
