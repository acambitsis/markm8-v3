// Mock Grading
// Generates mock grading results for testing

import type {
  CategoryScores,
  GradeFeedback,
  GradingConfig,
  ModelResult,
  PercentageRange,
} from '../../schema';
import { clampPercentage } from './utils';

/**
 * Generate mock grading results for testing
 * Uses the configured runs from GradingConfig
 */
export function generateMockGrade(config: GradingConfig): {
  letterGradeRange: string;
  percentageRange: PercentageRange;
  feedback: GradeFeedback;
  categoryScores: CategoryScores;
  modelResults: ModelResult[];
} {
  const { runs } = config;

  // Generate random percentage between 70-95
  const basePercentage = Math.floor(Math.random() * 26) + 70;
  const lowerBound = Math.max(0, basePercentage - 3);
  const upperBound = Math.min(100, basePercentage + 3);

  // Small per-run variation to mimic model variance.
  const centerIndex = Math.floor(runs.length / 2);
  const deviations = runs.map((_, i) => (i - centerIndex) * 2);

  // Generate category scores aligned with overall percentage
  // Add some variation to make it realistic (scores vary by ±5-10 points)
  const categoryScores: CategoryScores = {
    contentUnderstanding: clampPercentage(
      basePercentage + Math.floor(Math.random() * 11) - 5,
    ),
    structureOrganization: clampPercentage(
      basePercentage + Math.floor(Math.random() * 11) - 5,
    ),
    criticalAnalysis: clampPercentage(
      basePercentage + Math.floor(Math.random() * 11) - 5,
    ),
    languageStyle: clampPercentage(
      basePercentage + Math.floor(Math.random() * 11) - 5,
    ),
    citationsReferences: clampPercentage(
      basePercentage + Math.floor(Math.random() * 11) - 5,
    ),
  };

  return {
    letterGradeRange:
      basePercentage >= 90 ? 'A' : basePercentage >= 80 ? 'B' : 'C',
    percentageRange: {
      lower: lowerBound,
      upper: upperBound,
    },
    feedback: {
      strengths: [
        {
          title: 'Clear Structure',
          description:
            'Your essay follows a logical progression with well-defined sections.',
          evidence:
            'The introduction clearly sets up the thesis and each paragraph builds on the previous.',
        },
        {
          title: 'Strong Evidence',
          description:
            'You support your arguments with relevant examples and citations.',
          evidence:
            'Multiple references to primary and secondary sources strengthen your analysis.',
        },
        {
          title: 'Engaging Writing Style',
          description:
            'Your prose is readable and maintains reader interest throughout.',
        },
      ],
      improvements: [
        {
          title: 'Transition Clarity',
          description: 'Some paragraph transitions could be smoother.',
          suggestion:
            'Use transitional phrases to connect ideas between paragraphs.',
          detailedSuggestions: [
            'Add "Furthermore" or "In addition" when introducing supporting points',
            'Use "However" or "Conversely" for contrasting ideas',
            'Reference previous paragraphs: "Building on this point..."',
          ],
        },
        {
          title: 'Conclusion Depth',
          description:
            'The conclusion could more effectively synthesize your arguments.',
          suggestion:
            'Rather than summarizing, show how your points connect to form a larger insight.',
        },
        {
          title: 'Evidence Integration',
          description:
            'Some evidence could be more seamlessly integrated into your argument.',
          suggestion:
            'Use signal phrases to introduce evidence and explain how it supports your thesis.',
        },
      ],
      languageTips: [
        {
          category: 'Academic Tone',
          feedback:
            'Consider avoiding contractions in formal academic writing.',
        },
        {
          category: 'Vocabulary',
          feedback: 'Vary your word choice to avoid repetition of key terms.',
        },
        {
          category: 'Sentence Structure',
          feedback:
            'Mix simple and complex sentences to create better rhythm and flow.',
        },
      ],
      resources: [
        {
          title: 'Purdue OWL - Transitions',
          url: 'https://owl.purdue.edu/owl/general_writing/mechanics/transitions_and_transitional_devices/',
          description:
            'Comprehensive guide on using transitional phrases effectively.',
        },
        {
          title: 'Purdue OWL - Academic Writing',
          url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/',
          description:
            'Guidelines for academic writing style and conventions.',
        },
      ],
    },
    categoryScores,
    modelResults: runs.map((run, i) => ({
      model: run.model,
      percentage: clampPercentage(basePercentage + deviations[i]!),
      included: true,
    })),
  };
}
