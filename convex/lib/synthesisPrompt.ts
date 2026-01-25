// Synthesis Prompt
// LLM prompt for synthesizing feedback from multiple grading runs
// Version tracked on grade records for reproducibility

import type { GradeFeedback } from '../schema';

/**
 * Synthesis prompt version - update when prompt changes
 * Format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes to output structure
 * - MINOR: Significant prompt improvements
 * - PATCH: Minor tweaks, clarifications
 */
export const SYNTHESIS_PROMPT_VERSION = '1.0.0';

/**
 * Raw feedback from a single grading run (includes model and percentage for context)
 */
type RawGradingFeedback = {
  model: string;
  percentage: number;
  feedback: GradeFeedback;
};

/**
 * Input data for synthesis prompt
 */
type SynthesisPromptInput = {
  assignmentTitle?: string;
  assignmentInstructions?: string;
  academicLevel?: string;
  rubric?: string;
  focusAreas?: string[];
  essayContent: string;
  feedbackFromRuns: RawGradingFeedback[];
};

/**
 * Builds the synthesis prompt with full essay context using XML delimiters
 */
export function buildSynthesisPrompt(input: SynthesisPromptInput): string {
  const {
    assignmentTitle,
    assignmentInstructions,
    academicLevel,
    rubric,
    focusAreas,
    essayContent,
    feedbackFromRuns,
  } = input;

  // Build assignment block only if there's content
  const assignmentParts = [
    assignmentTitle ? `<title>${assignmentTitle}</title>` : '',
    assignmentInstructions ? `<instructions>${assignmentInstructions}</instructions>` : '',
    academicLevel ? `<academic_level>${academicLevel}</academic_level>` : '',
  ].filter(Boolean);

  const assignmentBlock = assignmentParts.length > 0
    ? `<assignment>\n${assignmentParts.join('\n')}\n</assignment>`
    : '';

  return `You are synthesizing feedback from ${feedbackFromRuns.length} independent essay graders.

${assignmentBlock}

${rubric ? `<rubric>\n${rubric}\n</rubric>` : ''}

${focusAreas && focusAreas.length > 0 ? `<focus_areas>\n${focusAreas.map(a => `- ${a}`).join('\n')}\n</focus_areas>` : ''}

<essay>
${essayContent}
</essay>

<grader_feedback>
${feedbackFromRuns.map((run, i) => `
<grader_${i + 1} model="${run.model}" percentage="${run.percentage}">
${JSON.stringify(run.feedback, null, 2)}
</grader_${i + 1}>
`).join('\n')}
</grader_feedback>

<task>
Synthesize the feedback from all graders into a single, coherent response.

1. STRENGTHS: Select the 3-4 most specific strengths. Prefer those:
   - Mentioned by multiple graders
   - With direct quotes/evidence from the essay
   - Most relevant to the rubric criteria

2. IMPROVEMENTS: Merge overlapping suggestions into 3-4 most actionable items:
   - Combine similar points (e.g., "transitions" and "paragraph flow" are related)
   - Prioritize based on rubric weighting
   - Keep suggestions specific and actionable

3. LANGUAGE TIPS: Consolidate into unique tips, removing duplicates.

4. RESOURCES: If any graders suggested resources, include the most relevant 1-2.

Be concise. Preserve the best specific examples and evidence from the original feedback.
Reference the actual essay content when the graders cite evidence.
</task>`;
}
