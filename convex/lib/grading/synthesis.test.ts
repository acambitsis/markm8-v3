// Synthesis Module Tests
// Tests for feedback synthesis helpers and schema

import { describe, expect, it } from 'vitest';

import { buildSynthesisPrompt, type RawGradingFeedback } from '../synthesisPrompt';

describe('buildSynthesisPrompt', () => {
  const mockFeedback: RawGradingFeedback[] = [
    {
      model: 'openai/gpt-4',
      percentage: 75,
      feedback: {
        strengths: [{ title: 'Clear thesis', description: 'Well-articulated main argument' }],
        improvements: [{ title: 'Add citations', description: 'Support claims with sources', suggestion: 'Include at least 3 citations' }],
        languageTips: [{ category: 'Grammar', feedback: 'Watch subject-verb agreement' }],
      },
    },
    {
      model: 'anthropic/claude-3',
      percentage: 72,
      feedback: {
        strengths: [{ title: 'Strong intro', description: 'Engaging opening paragraph' }],
        improvements: [{ title: 'Conclusion weak', description: 'Needs stronger summary', suggestion: 'Restate key points' }],
        languageTips: [{ category: 'Style', feedback: 'Vary sentence length' }],
      },
    },
  ];

  it('includes assignment context when provided', () => {
    const prompt = buildSynthesisPrompt({
      assignmentTitle: 'Industrial Revolution Essay',
      assignmentInstructions: 'Write a 1000-word essay',
      academicLevel: 'undergraduate',
      essayContent: 'Sample essay content...',
      feedbackFromRuns: mockFeedback,
    });

    expect(prompt).toContain('<title>Industrial Revolution Essay</title>');
    expect(prompt).toContain('<instructions>Write a 1000-word essay</instructions>');
    expect(prompt).toContain('<academic_level>undergraduate</academic_level>');
  });

  it('includes rubric when provided', () => {
    const prompt = buildSynthesisPrompt({
      rubric: 'Focus on historical accuracy and argument structure',
      essayContent: 'Sample essay content...',
      feedbackFromRuns: mockFeedback,
    });

    expect(prompt).toContain('<rubric>');
    expect(prompt).toContain('Focus on historical accuracy');
  });

  it('includes focus areas when provided', () => {
    const prompt = buildSynthesisPrompt({
      focusAreas: ['Thesis clarity', 'Evidence usage'],
      essayContent: 'Sample essay content...',
      feedbackFromRuns: mockFeedback,
    });

    expect(prompt).toContain('<focus_areas>');
    expect(prompt).toContain('- Thesis clarity');
    expect(prompt).toContain('- Evidence usage');
  });

  it('includes essay content', () => {
    const prompt = buildSynthesisPrompt({
      essayContent: 'The Industrial Revolution transformed society...',
      feedbackFromRuns: mockFeedback,
    });

    expect(prompt).toContain('<essay>');
    expect(prompt).toContain('The Industrial Revolution transformed society...');
    expect(prompt).toContain('</essay>');
  });

  it('includes all grader feedback with model and percentage', () => {
    const prompt = buildSynthesisPrompt({
      essayContent: 'Sample essay...',
      feedbackFromRuns: mockFeedback,
    });

    expect(prompt).toContain('<grader_feedback>');
    expect(prompt).toContain('model="openai/gpt-4"');
    expect(prompt).toContain('percentage="75"');
    expect(prompt).toContain('model="anthropic/claude-3"');
    expect(prompt).toContain('percentage="72"');
    expect(prompt).toContain('Clear thesis');
    expect(prompt).toContain('Strong intro');
  });

  it('indicates the number of graders in the prompt', () => {
    const prompt = buildSynthesisPrompt({
      essayContent: 'Sample essay...',
      feedbackFromRuns: mockFeedback,
    });

    expect(prompt).toContain('synthesizing feedback from 2 independent essay graders');
  });

  it('omits optional sections when not provided', () => {
    const prompt = buildSynthesisPrompt({
      essayContent: 'Sample essay...',
      feedbackFromRuns: mockFeedback,
    });

    // Should not include assignment block if no title/instructions/level
    expect(prompt).not.toContain('<assignment>');
    expect(prompt).not.toContain('<rubric>');
    expect(prompt).not.toContain('<focus_areas>');
  });
});
