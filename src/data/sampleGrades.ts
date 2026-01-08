/**
 * Sample grade data for the landing page showcase.
 * These are real anonymized examples from actual graded essays.
 */

import type {
  AcademicLevel,
  GradeFeedback,
  ModelResult,
  PercentageRange,
} from '../../convex/schema';

export type SampleGrade = {
  id: string;
  title: string;
  subject: string;
  academicLevel: AcademicLevel;
  wordCount: number;
  letterGradeRange: string;
  percentageRange: PercentageRange;
  feedback: GradeFeedback;
  modelResults: ModelResult[];
};

export const sampleGrades: SampleGrade[] = [
  // Sample 1: Shakespeare/Hamlet - High School - A-/A (Real feedback)
  {
    id: 'literature-hamlet',
    title: 'Internal Conflicts in Hamlet',
    subject: 'Literature',
    academicLevel: 'high_school',
    wordCount: 1247,
    letterGradeRange: 'A- to A',
    percentageRange: { lower: 92, upper: 93 },
    feedback: {
      strengths: [
        {
          title: 'Clear and Insightful Thesis',
          description:
            'The essay presents a precise thesis statement that directly addresses the assignment by identifying key internal conflicts and their impact on Hamlet\'s character and fate.',
          evidence:
            'This essay argues that Hamlet\'s internal conflicts—particularly his struggle between the obligation to avenge his father and his philosophical questioning of that obligation—define his character and ultimately lead to his tragic fate.',
        },
        {
          title: 'Strong Character Psychology Analysis',
          description:
            'The essay excels in exploring Hamlet\'s internal conflicts, such as thought vs. action, with nuanced insights into his paralysis and philosophical depth, aligning perfectly with the focus area.',
          evidence:
            'Analysis of soliloquies like "To be, or not to be" and references to over-analysis as "his defining characteristic and his fatal flaw."',
        },
        {
          title: 'Effective Integration of Textual Evidence',
          description:
            'Quotes are well-chosen, relevant, and smoothly integrated to support claims, demonstrating strong command of textual evidence as per the rubric.',
          evidence:
            '"The play\'s the thing / Wherein I\'ll catch the conscience of the King" (2.2.604-605) used to illustrate Hamlet\'s need for proof; proper MLA formatting throughout.',
        },
        {
          title: 'Logical Structure and Transitions',
          description:
            'The essay follows a clear progression from introduction to conflicts, development, relationships, resolution, and conclusion, with smooth transitions enhancing readability.',
        },
      ],
      improvements: [
        {
          title: 'Deeper Exploration of Conflict Resolution',
          description:
            'While the resolution in Act 5 is addressed, it could be analyzed more thoroughly to show how specific events lead to Hamlet\'s change.',
          suggestion:
            'Expand the final act analysis with additional quotes and connect it explicitly to earlier conflicts.',
          detailedSuggestions: [
            'Include analysis of Hamlet\'s letter to Horatio or his final soliloquy for more evidence.',
            'Compare pre- and post-England Hamlet more directly.',
          ],
        },
        {
          title: 'Broader Incorporation of Themes and Motifs',
          description:
            'The essay identifies conflicts well but could enhance literary analysis by linking them to play-wide motifs like madness or corruption for deeper insight.',
          suggestion:
            'Weave in motifs such as the theme of appearance vs. reality throughout the analysis.',
          detailedSuggestions: [
            'Reference the Ghost\'s ambiguity earlier.',
            'Discuss how the play-within-a-play motif underscores Hamlet\'s intellect.',
          ],
        },
        {
          title: 'Enhanced Quote Explanation Depth',
          description:
            'Quotes are integrated smoothly, but some explanations could delve deeper into word choice or implications to elevate critical analysis.',
          suggestion:
            'After each quote, analyze specific language (e.g., diction, imagery) and its revelation of psychology.',
          detailedSuggestions: [
            'For "the native hue of resolution / Is sicklied o\'er...", unpack metaphors of color and sickness.',
          ],
        },
      ],
      languageTips: [
        {
          category: 'Academic Tone',
          feedback:
            'Maintain formal tone consistently; avoid casual phrases like "thinks—perhaps too much"—revise to "engages in excessive contemplation" for precision.',
        },
        {
          category: 'Sentence Structure',
          feedback:
            'Vary sentence length more; some paragraphs have long, complex sentences—break them up for better rhythm.',
        },
        {
          category: 'Vocabulary',
          feedback:
            'Strong word choice overall, but elevate with more precise terms like "indecision" instead of repeating "hesitates"; avoid repetition of "conflict".',
        },
        {
          category: 'Punctuation',
          feedback:
            'Excellent use of em-dashes for emphasis; ensure consistency in quote punctuation per MLA (e.g., periods inside quotes).',
        },
      ],
      resources: [
        {
          title: 'Purdue OWL MLA Guide',
          url: 'https://owl.purdue.edu/owl/research_and_citation/mla_style/mla_formatting_and_style_guide/mla_general_format.html',
          description:
            'Reinforces perfect citations and quote formatting already strong in this essay.',
        },
        {
          title: 'SparkNotes Hamlet Analysis',
          url: 'https://www.sparknotes.com/shakespeare/hamlet/',
          description:
            'Provides additional insights into character psychology and motifs to deepen future analyses.',
        },
      ],
    },
    modelResults: [
      { model: 'Grok 4.1', percentage: 92, included: true },
      { model: 'Grok 4.1', percentage: 93, included: true },
    ],
  },

  // Sample 2: Industrial Revolution - Undergraduate - B (Real feedback)
  {
    id: 'history-industrial',
    title: 'Social and Economic Impacts of the Industrial Revolution',
    subject: 'History',
    academicLevel: 'undergraduate',
    wordCount: 1456,
    letterGradeRange: 'B',
    percentageRange: { lower: 85, upper: 85 },
    feedback: {
      strengths: [
        {
          title: 'Clear and Arguable Thesis',
          description:
            'The essay presents a strong, specific thesis statement that effectively guides the entire argument, clearly outlining the dual economic opportunities and social dislocations caused by the Industrial Revolution.',
          evidence:
            '"This essay argues that the Industrial Revolution fundamentally restructured British life, creating both unprecedented economic opportunities and severe social dislocations that would define the character of modern industrial society."',
        },
        {
          title: 'Comprehensive Coverage of Required Impacts',
          description:
            'The essay thoroughly addresses at least three major social impacts and three economic impacts, aligning well with assignment requirements.',
          evidence:
            'Economic: factory system, urbanization, new classes (paragraphs 2-4); Social: family economy changes, working conditions, trade unions/Chartism (paragraphs 5-7).',
        },
        {
          title: 'Logical Structure and Smooth Flow',
          description:
            'Well-organized with a clear introduction, body paragraphs progressing logically from economic to social impacts, and a synthesizing conclusion.',
          evidence:
            'Progression from economic transformations to social impacts, with phrases like "However, the economic benefits... were distributed highly unequally" linking sections.',
        },
        {
          title: 'Engaging and Insightful Conclusion',
          description:
            'The conclusion effectively synthesizes the analysis, reinforcing the thesis and providing broader historical significance without introducing new information.',
          evidence:
            '"The world we inhabit today, for better and worse, is in large measure a product of the transformations set in motion in late 18th century Britain."',
        },
      ],
      improvements: [
        {
          title: 'Absence of Citations and References',
          description:
            'The essay lacks any formal citations in Chicago style, despite referencing historians like Hobsbawm and Engels, and mentioning parliamentary investigations.',
          suggestion:
            'Incorporate Chicago-style footnotes or endnotes for all sources, including page numbers for quotes and paraphrases.',
          detailedSuggestions: [
            'Identify specific editions of works (e.g., Engels\' "The Condition of the Working Class in England").',
            'Add 8-10 citations throughout.',
            'Include a bibliography with at least 5-7 sources.',
          ],
        },
        {
          title: 'Limited Use of Primary Sources',
          description:
            'While secondary sources like Hobsbawm and Engels are referenced, there are no direct quotes from primary sources like factory reports or worker testimonies.',
          suggestion:
            'Integrate direct quotations from primary sources such as the 1833 Sadler Committee reports to strengthen evidence.',
          detailedSuggestions: [
            'Quote from the 1833 Sadler Committee Report on child labor.',
            'Use excerpts from Engels\' observations with precise citations.',
            'Aim for 2-3 primary source integrations per major impact.',
          ],
        },
        {
          title: 'Imbalance Between Social and Economic Analysis',
          description:
            'Social impacts receive more detailed treatment than economic ones, which are somewhat descriptive rather than deeply analytical.',
          suggestion:
            'Expand economic analysis with more evidence on trade changes or class emergence, ensuring equal depth.',
          detailedSuggestions: [
            'Add data on GDP growth or export figures from 1800-1850.',
            'Analyze economic theories (e.g., Ricardo) more critically in relation to impacts.',
          ],
        },
      ],
      languageTips: [
        {
          category: 'Academic Tone',
          feedback:
            'Maintains a formal, objective tone throughout; avoid minor informal phrases like "nothing short of revolutionary" by replacing with "profoundly transformative" for precision.',
        },
        {
          category: 'Vocabulary',
          feedback:
            'Strong historical vocabulary (e.g., "proletariat", "Chartist movement"); enhance variety by replacing repetitive terms like "profound" (used 3x) with synonyms.',
        },
        {
          category: 'Sentence Structure',
          feedback:
            'Varied sentence lengths create good rhythm; watch for run-on sentences in longer paragraphs—break them with semicolons or periods for clarity.',
        },
        {
          category: 'Grammar',
          feedback:
            'Virtually error-free; ensure consistent tense (mostly past, but conditional is appropriately used).',
        },
      ],
      resources: [
        {
          title: 'The Chicago Manual of Style Online',
          url: 'https://www.chicagomanualofstyle.org/home.html',
          description:
            'Essential guide for mastering Chicago citation style, with examples for footnotes and bibliographies.',
        },
        {
          title: 'British History Online: Parliamentary Papers',
          url: 'https://www.british-history.ac.uk/search/series/parliamentary-papers',
          description:
            'Free access to primary sources like 1830s factory reports and Sadler Committee testimonies.',
        },
        {
          title: 'Purdue OWL: Academic Writing',
          url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/index.html',
          description:
            'Practical tips on thesis development, analysis vs. description, and essay structure.',
        },
      ],
    },
    modelResults: [
      { model: 'Grok 4.1', percentage: 85, included: true },
      { model: 'Grok 4.1', percentage: 85, included: true },
    ],
  },

  // Sample 3: Employment Law - Professional - D-/D (Real feedback)
  {
    id: 'law-employment',
    title: 'Employment Tribunal Advice: Harassment and Unfair Dismissal',
    subject: 'Law',
    academicLevel: 'professional',
    wordCount: 2407,
    letterGradeRange: 'D- to D',
    percentageRange: { lower: 62, upper: 65 },
    feedback: {
      strengths: [
        {
          title: 'Comprehensive Legal Knowledge and Application',
          description:
            'The letter demonstrates a solid understanding of relevant employment law, accurately identifying and applying key provisions from the Equality Act 2010 and Employment Rights Act 1996.',
          evidence:
            'Detailed sections on s26(1), s26(2), s26(3) Equality Act, with cases like Driskel v Peninsula Business Services Ltd, Reed v Stedman, and British Home Stores v Burchell test; remedies outlined with Vento bands.',
        },
        {
          title: 'Clear Structure and Professional Format',
          description:
            'Both tasks follow a logical structure: the letter uses numbered sections for clarity, and the reflective essay divides into Part A and B with progression from challenges to improvements.',
          evidence:
            'Letter: numbered sections 1-8 (Summary, Harassment types, Unfair Dismissal, Remedies, etc.); Reflective: Phase 1 vs Phase 2 comparison, action plan list.',
        },
        {
          title: 'Honest and Insightful Reflection',
          description:
            'The reflective essay effectively shows personal growth in teamwork and negotiation skills, linking challenges like ADHD to specific improvements and future plans.',
          evidence:
            '"In Phase 1, my attendance was very inconsistent... In phase 2 I started to do a bit more preparation"; Belbin\'s theory referenced; negotiation positives like "reading the room".',
        },
        {
          title: 'Balanced Advice on Settlement',
          description:
            'The letter provides practical, client-focused advice on settlement pros/cons, enhancing its advisory value.',
          evidence:
            'Advantages: "Faster and cheaper, Less stressful"; Disadvantages: "Usually a lower payout, No public finding of fault".',
        },
      ],
      improvements: [
        {
          title: 'Lack of OSCOLA Referencing',
          description:
            'No footnotes, citations, or bibliography are present in the letter, despite requirement for OSCOLA referencing; cases are mentioned but not properly cited.',
          suggestion:
            'Incorporate full OSCOLA footnotes for all legal provisions and cases, and add a bibliography.',
          detailedSuggestions: [
            'Use OSCOLA 4th edn guide: e.g., for cases: Richman v Attewell [2014] EWCA Civ 1493.',
            'Pinpoint paragraphs where cases are cited and add superscript numbers linking to footnotes.',
            'Ensure all statutes are cited: e.g., Equality Act 2010, s 26(1).',
          ],
        },
        {
          title: 'Inconsistent Date and Timeline',
          description:
            'Letter dated 14 May 2025, after submission deadline (30 Apr 2025), and states hearing "has not yet taken place" but date is post-submission.',
          suggestion:
            'Align dates with assignment scenario (pre-hearing) and proofread for timeline accuracy.',
          detailedSuggestions: [
            'Change date to pre-30 Apr 2025, e.g., 20 April 2025.',
            'Double-check facts: promotion "1st of July 2024" consistent?',
          ],
        },
        {
          title: 'Informal Tone and Typos in Reflective Essay',
          description:
            'Reflective essay uses casual language, contractions, and errors (e.g., "load" for "loud", "esses" for "areas", run-on sentences).',
          suggestion:
            'Adopt formal academic tone, proofread, and use tools like Grammarly.',
          detailedSuggestions: [
            'Replace "id feel" with "I would feel"; "load" to "loud"; "weak esses" to "weaknesses".',
            'Shorten sentences: e.g., split "ADHD often comes with mood... out of place."',
          ],
        },
        {
          title: 'Limited Critical Depth in Analysis',
          description:
            'Legal analysis identifies issues and cites cases but lacks deeper evaluation (e.g., counterarguments, strength of evidence).',
          suggestion:
            'Develop arguments by weighing employer defences and linking evidence more critically.',
          detailedSuggestions: [
            'For unfair dismissal: discuss Burchell test prongs explicitly with facts.',
            'In reflection: analyse Belbin roles\' application to specific group experiences.',
          ],
        },
        {
          title: 'Underdeveloped Action Plans in Reflection',
          description:
            'Action plans listed but not attached as appendices (per instructions); reflection could better evidence progress via appendices.',
          suggestion:
            'Attach Phase 1/2 action plans as appendices and reference them explicitly in text.',
        },
      ],
      languageTips: [
        {
          category: 'Academic Tone',
          feedback:
            'Avoid contractions (e.g., "id" to "I would") and colloquialisms (e.g., "energy crashes", "brain told me") in reflective essay; use formal phrasing like "periods of low motivation".',
        },
        {
          category: 'Grammar and Spelling',
          feedback:
            'Correct typos: "load" to "loud", "esses" to "weaknesses", "switched on" to "switched-on"; use consistent capitalisation (e.g., "phase 1" to "Phase 1").',
        },
        {
          category: 'Sentence Structure',
          feedback:
            'Break up long, run-on sentences in reflection (e.g., ADHD paragraph); aim for variety: short for impact, complex for analysis.',
        },
        {
          category: 'Vocabulary',
          feedback:
            'Enhance precision: "big change" to "significant transition"; "push myself" to "challenge myself proactively" to elevate academic style.',
        },
        {
          category: 'Punctuation',
          feedback:
            'Add commas in lists and clauses (e.g., "touched you at work, rubbing your shoulders"); use semicolons for related independents.',
        },
      ],
      resources: [
        {
          title: 'OSCOLA Referencing Guide',
          url: 'https://www.law.ox.ac.uk/sites/default/files/migrated/oscola_4th_edn_hart_2012.pdf',
          description:
            'Official guide for correct footnote and bibliography formatting essential for legal writing.',
        },
        {
          title: 'Reflective Writing in Law Guide',
          url: 'https://www.law.ac.uk/resources/writing-reflectively/',
          description:
            'University of Law resource on structuring reflections with models like Gibbs\' cycle for deeper analysis.',
        },
        {
          title: 'Belbin Team Roles',
          url: 'https://www.belbin.com/about/belbin-team-roles',
          description:
            'Expand on Belbin theory with examples to strengthen teamwork reflection.',
        },
        {
          title: 'Employment Tribunal Guide',
          url: 'https://www.gov.uk/employment-tribunals',
          description:
            'Official GOV.UK site for accurate details on tribunals, remedies, and processes.',
        },
      ],
    },
    modelResults: [
      { model: 'Grok 4.1', percentage: 62, included: true },
      { model: 'Grok 4.1', percentage: 65, included: true },
    ],
  },
];

// Helper to get academic level display label
export const academicLevelLabels: Record<AcademicLevel, string> = {
  high_school: 'High School',
  undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate',
  professional: 'Professional',
};
