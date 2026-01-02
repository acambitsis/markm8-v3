// Zod schema for AI grading output
// Must match convex/schema.ts validators exactly

import { z } from 'zod';

/**
 * Zod schema for AI grading output
 * Matches the structure defined in convex/schema.ts validators
 */
export const gradeOutputSchema = z.object({
  percentage: z.number().min(0).max(100),
  feedback: z.object({
    strengths: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
          evidence: z.string().optional(),
        }),
      )
      .min(3)
      .max(5),
    improvements: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
          suggestion: z.string(),
          detailedSuggestions: z.array(z.string()).optional(),
        }),
      )
      .min(3)
      .max(5),
    languageTips: z
      .array(
        z.object({
          category: z.string(),
          feedback: z.string(),
        }),
      )
      .min(3)
      .max(5),
    resources: z
      .array(
        z.object({
          title: z.string(),
          url: z.string().optional(),
          description: z.string(),
        }),
      )
      .min(2)
      .max(4)
      .optional(),
  }),
  categoryScores: z.object({
    contentUnderstanding: z.number().min(0).max(100),
    structureOrganization: z.number().min(0).max(100),
    criticalAnalysis: z.number().min(0).max(100),
    languageStyle: z.number().min(0).max(100),
    citationsReferences: z.number().min(0).max(100).optional(),
  }),
});

export type GradeOutput = z.infer<typeof gradeOutputSchema>;
