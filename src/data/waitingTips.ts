// Subject-Specific Writing Tips
// Displayed during grading wait (Tier 1 experience)
// Rotates every 8 seconds to keep users engaged

export const waitingTips: Record<string, string[]> = {
  philosophy: [
    'Strong philosophy papers state their thesis clearly in the first paragraph. Is yours specific and arguable?',
    'The best philosophical arguments engage seriously with counterarguments rather than dismissing them.',
    'Avoid vague terms like "society" or "people believe" without specifying who or providing evidence.',
    'Each paragraph should advance your argument, not just summarize what philosophers said.',
    'Philosophical writing prizes clarity over complexity. If a sentence is confusing, simplify it.',
    'When citing philosophers, explain their ideas in your own words before quoting directly.',
    'A strong conclusion does more than summarize — it shows why your argument matters.',
  ],

  law: [
    'IRAC structure (Issue, Rule, Application, Conclusion) keeps legal analysis organized and persuasive.',
    'When citing cases, briefly explain why they\'re relevant — don\'t assume the reader knows.',
    'Strong legal writing anticipates counterarguments and addresses them directly.',
    'Be precise with legal terms. "Liable" and "guilty" are not interchangeable.',
    'Every legal conclusion should be supported by authority: statute, case law, or regulation.',
    'Distinguish between holding (the rule) and dicta (non-binding observations) when citing cases.',
    'Policy arguments can strengthen your analysis, but legal authority should come first.',
  ],

  literature: [
    'Literary analysis should interpret meaning, not summarize plot. Focus on the "why" and "how."',
    'Use direct quotes from the text as evidence, but always explain what they demonstrate.',
    'Connect your close reading to broader themes or historical/cultural context.',
    'Avoid vague claims like "the author uses symbolism." Specify what symbol and what it represents.',
    'Your thesis should make an arguable claim about the text, not state an obvious fact.',
    'Consider the formal elements: narrative voice, structure, imagery, and tone all carry meaning.',
    'When analyzing poetry, pay attention to line breaks, rhythm, and sound patterns.',
  ],

  history: [
    'Historical arguments should explain causation — why events happened, not just what happened.',
    'Primary sources strengthen historical writing. Can you incorporate firsthand accounts?',
    'Avoid presentism: judging historical figures by modern standards without context.',
    'When making claims about historical consensus, cite specific historians who hold that view.',
    'Periodization matters. Be specific about dates and avoid vague phrases like "back then."',
    'Consider multiple perspectives: political, economic, social, and cultural factors often intersect.',
    'Historiography evolves. Acknowledge when scholars disagree about interpretations.',
  ],

  psychology: [
    'APA format requires in-text citations with author and year: (Smith, 2023).',
    'When discussing studies, include key details: sample size, methodology, and limitations.',
    'Distinguish between correlation and causation. Most studies show correlation only.',
    'The Discussion section should interpret findings, not just repeat the Results.',
    'Address potential confounds and alternative explanations for research findings.',
    'Operational definitions matter. How exactly was each variable measured?',
    'Effect sizes tell you more than statistical significance about practical importance.',
  ],

  business: [
    'Business writing values clarity and actionability. What should the reader do with this information?',
    'Support claims with data. "Sales increased significantly" is weaker than "Sales increased 23%."',
    'Executive summaries should stand alone. A reader should understand your point without reading further.',
    'When analyzing cases, consider multiple stakeholder perspectives, not just shareholders.',
    'Recommendations should be specific and feasible, with implementation considerations.',
    'Financial projections should include assumptions and sensitivity analysis.',
    'Connect your analysis to relevant frameworks (SWOT, Porter\'s Five Forces, etc.) when appropriate.',
  ],

  economics: [
    'Economic arguments should distinguish between positive (what is) and normative (what should be) claims.',
    'When using models, state your assumptions clearly. All models simplify reality.',
    'Graphs and equations should be explained in words, not left to speak for themselves.',
    'Consider both short-run and long-run effects of policies or market changes.',
    'Opportunity cost is central to economic thinking. What trade-offs are involved?',
    'Be careful with causal claims. Correlation in economic data rarely proves causation.',
    'Acknowledge uncertainty in forecasts and projections. The future is inherently unpredictable.',
  ],

  sociology: [
    'Sociological analysis examines patterns and structures, not just individual behavior.',
    'Define key concepts clearly. Terms like "culture" and "power" have specific meanings in sociology.',
    'Consider intersectionality: how do race, class, gender, and other factors interact?',
    'Distinguish between micro (individual), meso (institutional), and macro (societal) levels of analysis.',
    'Qualitative and quantitative methods answer different types of questions. Match method to question.',
    'Reflexivity matters. How might your own position affect your analysis?',
    'Social phenomena are historically contingent. What we observe today may not hold universally.',
  ],

  science: [
    'Scientific writing follows IMRaD structure: Introduction, Methods, Results, and Discussion.',
    'Methods should be detailed enough for another researcher to replicate your work.',
    'Report both positive and null results. Negative findings are scientifically valuable.',
    'Figures and tables should be interpretable without reading the full text.',
    'Distinguish between statistical significance and biological/practical significance.',
    'Cite primary literature, not just review articles, for specific claims.',
    'Acknowledge limitations honestly. Every study has them.',
  ],

  engineering: [
    'Engineering reports should lead with key findings and recommendations.',
    'Include units and significant figures appropriate to your precision.',
    'Document assumptions and constraints clearly. Design decisions depend on them.',
    'Consider failure modes and edge cases, not just the expected use case.',
    'Trade-offs are central to engineering. Explain why you chose one approach over alternatives.',
    'Safety factors and margins should be justified, not arbitrary.',
    'Validation and verification are distinct. Did you build the right thing, and did you build it right?',
  ],

  political_science: [
    'Political science distinguishes between normative theory and empirical analysis.',
    'When comparing political systems, control for relevant variables like economic development.',
    'Consider institutional factors: how do rules and structures shape political outcomes?',
    'Case selection matters. Why these countries/time periods/events and not others?',
    'Acknowledge the limits of generalization from case studies.',
    'Political concepts like "democracy" and "power" require clear operational definitions.',
    'Consider both domestic and international factors in analyzing political phenomena.',
  ],

  general: [
    'Strong essays have a clear thesis that appears early and guides the entire paper.',
    'Each paragraph should have one main idea, stated in a topic sentence.',
    'Transitions between paragraphs help readers follow your argument.',
    'Proofread for common errors: subject-verb agreement, comma splices, run-on sentences.',
    'Your conclusion should do more than summarize — explain the significance of your argument.',
    'Vary sentence length and structure for better readability.',
    'Active voice is usually clearer and more direct than passive voice.',
    'Cite sources consistently and completely. When in doubt, cite.',
    'Read your essay aloud. Your ear will catch problems your eye misses.',
  ],
};

// Keywords that map to each subject for fuzzy matching
const subjectKeywords: Record<string, string[]> = {
  philosophy: ['philosophy', 'ethics', 'metaphysics', 'epistemology', 'logic', 'moral', 'existential', 'phenomenology'],
  law: ['law', 'legal', 'constitutional', 'criminal', 'civil', 'tort', 'contract', 'jurisprudence', 'statute'],
  literature: ['literature', 'english', 'literary', 'poetry', 'novel', 'fiction', 'drama', 'narrative', 'writing', 'creative writing'],
  history: ['history', 'historical', 'ancient', 'medieval', 'modern', 'world history', 'american history', 'european history'],
  psychology: ['psychology', 'psychological', 'cognitive', 'behavioral', 'clinical', 'developmental', 'social psychology', 'neuroscience'],
  business: ['business', 'management', 'marketing', 'finance', 'accounting', 'entrepreneurship', 'strategy', 'mba', 'organizational'],
  economics: ['economics', 'economic', 'macroeconomics', 'microeconomics', 'econometrics', 'fiscal', 'monetary', 'market'],
  sociology: ['sociology', 'sociological', 'social science', 'anthropology', 'cultural studies', 'gender studies', 'urban studies'],
  science: ['science', 'biology', 'chemistry', 'physics', 'environmental', 'ecology', 'genetics', 'biochemistry', 'lab', 'scientific'],
  engineering: ['engineering', 'computer science', 'electrical', 'mechanical', 'civil engineering', 'software', 'systems', 'technical'],
  political_science: ['political science', 'politics', 'government', 'international relations', 'public policy', 'diplomacy', 'geopolitics'],
};

/**
 * Get writing tips for a given subject
 * Uses fuzzy matching against known subjects, falls back to 'general'
 */
export function getTipsForSubject(subject: string): string[] {
  const normalized = subject.toLowerCase().trim();

  // Direct match first
  const directMatch = waitingTips[normalized];
  if (directMatch) {
    return directMatch;
  }

  // Fuzzy match against keywords
  for (const [subjectKey, keywords] of Object.entries(subjectKeywords)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword) || keyword.includes(normalized)) {
        const matched = waitingTips[subjectKey];
        if (matched) {
          return matched;
        }
      }
    }
  }

  // Default to general tips - always defined
  return waitingTips.general ?? [];
}

/**
 * Get a random tip for a subject
 */
export function getRandomTip(subject: string): string {
  const tips = getTipsForSubject(subject);
  const tip = tips[Math.floor(Math.random() * tips.length)];
  return tip ?? tips[0] ?? 'Focus on clarity and structure in your writing.';
}
