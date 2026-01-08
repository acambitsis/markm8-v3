// Grading prompt construction
// Builds structured prompts for AI grading from essay data

import type { AcademicLevel } from '../schema';

type EssayData = {
  instructions: string;
  rubric?: string;
  focusAreas?: string[];
  academicLevel: AcademicLevel;
  content: string;
};

/**
 * Build grading prompt from essay data
 * Creates a structured prompt that guides the AI to provide comprehensive feedback
 */
export function buildGradingPrompt(essay: EssayData): string {
  const { instructions, rubric, focusAreas, academicLevel, content } = essay;

  const academicLevelLabel = {
    high_school: 'High School',
    undergraduate: 'Undergraduate',
    postgraduate: 'Postgraduate',
    professional: 'Professional',
  }[academicLevel];

  let prompt = `You are an expert academic essay grader with extensive experience evaluating student work at the ${academicLevelLabel} level. Your task is to provide a comprehensive, constructive assessment of the following essay.

## Assignment Instructions

${instructions}

`;

  if (rubric) {
    prompt += `## Custom Rubric

The essay should be evaluated according to these specific criteria:

${rubric}

`;
  }

  if (focusAreas && focusAreas.length > 0) {
    prompt += `## Focus Areas

Please pay special attention to these areas in your feedback:

${focusAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}

`;
  }

  prompt += `## Academic Level

This essay is written at the ${academicLevelLabel} level. Adjust your expectations and feedback accordingly.

## Essay Content

${content}

---

## Your Task

Provide a detailed grade and feedback following this structure:

1. **Percentage Score**: A numerical score from 0-100 that reflects the overall quality of the essay.

2. **Strengths** (3-5 items): Identify the essay's strongest aspects. For each strength:
   - Provide a clear, descriptive title
   - Explain why this is a strength
   - Include specific evidence from the essay (quotes or references to specific paragraphs/sections)

3. **Areas for Improvement** (3-5 items): Identify areas where the essay could be enhanced. For each area:
   - Provide a clear, descriptive title
   - Explain the issue or weakness
   - Offer a concrete suggestion for improvement
   - Optionally include detailed, actionable suggestions (specific steps the student can take)

4. **Language Tips** (3-5 items): Provide guidance on language, style, and writing mechanics. For each tip:
   - Specify the category (e.g., "Academic Tone", "Grammar", "Vocabulary", "Sentence Structure")
   - Provide specific, actionable feedback

5. **Recommended Resources** (2-4 items, optional): Suggest helpful resources that could aid the student's writing. For each resource:
   - Provide a descriptive title
   - Include a URL if applicable
   - Explain how this resource will help

6. **Category Scores**: Provide numerical scores (0-100) for each of these categories:
   - Content & Understanding: How well the essay demonstrates subject knowledge and understanding
   - Structure & Organization: Logical flow, paragraph structure, transitions
   - Critical Analysis: Depth of analysis, argument quality, use of evidence
   - Language & Style: Grammar, vocabulary, academic tone
   - Citations & References (optional): Proper citation format, source quality (include only if relevant)

## Guidelines

- Be constructive and encouraging while being honest about areas for improvement
- Provide specific examples from the essay to support your feedback
- Focus on actionable suggestions that will help the student improve
- Consider the academic level when setting expectations
- Ensure all feedback is relevant to the assignment instructions and rubric (if provided)
- If focus areas are specified, ensure your feedback addresses them prominently

Now, provide your comprehensive grade and feedback in the required JSON format.`;

  return prompt;
}
