// Essay Statistics Calculator
// Client-side calculations for the waiting experience (Tier 1)
// No LLM needed - pure text analysis

export type EssayStats = {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgSentenceLength: number;
  avgWordLength: number;
  readingLevel: string;
  readingGradeLevel: number;
  vocabularyDiversity: number;
  sentenceLengths: number[]; // For sparkline visualization
};

/**
 * Calculate comprehensive essay statistics
 * All calculations are client-side for instant display
 */
export function calculateEssayStats(content: string): EssayStats {
  if (!content || content.trim().length === 0) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      avgSentenceLength: 0,
      avgWordLength: 0,
      readingLevel: 'N/A',
      readingGradeLevel: 0,
      vocabularyDiversity: 0,
      sentenceLengths: [],
    };
  }

  // Clean the content
  const cleanContent = content.trim();

  // Word analysis
  const words = cleanContent.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Sentence analysis
  // Split on sentence-ending punctuation, accounting for abbreviations
  const sentences = cleanContent
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const sentenceCount = sentences.length;

  // Paragraph analysis
  const paragraphs = cleanContent
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  const paragraphCount = paragraphs.length;

  // Calculate sentence lengths (word count per sentence) for sparkline
  const sentenceLengths = sentences.map(
    s => s.split(/\s+/).filter(w => w.length > 0).length,
  );

  // Average sentence length
  const avgSentenceLength
    = sentenceCount > 0
      ? Math.round((wordCount / sentenceCount) * 10) / 10
      : 0;

  // Average word length
  const totalCharacters = words.reduce((sum, word) => sum + word.replace(/[^a-z]/gi, '').length, 0);
  const avgWordLength
    = wordCount > 0
      ? Math.round((totalCharacters / wordCount) * 10) / 10
      : 0;

  // Syllable count estimation (for Flesch-Kincaid)
  const syllableCount = words.reduce(
    (sum, word) => sum + countSyllables(word),
    0,
  );

  // Flesch-Kincaid Grade Level
  // Formula: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
  const readingGradeLevel
    = sentenceCount > 0 && wordCount > 0
      ? Math.max(
        0,
        Math.round(
          (0.39 * (wordCount / sentenceCount)
            + 11.8 * (syllableCount / wordCount)
            - 15.59)
            * 10,
        ) / 10,
      )
      : 0;

  // Convert grade level to readable label
  const readingLevel = getReadingLevelLabel(readingGradeLevel);

  // Vocabulary diversity (unique words / total words)
  const uniqueWords = new Set(
    words.map(w => w.toLowerCase().replace(/[^a-z]/gi, '')).filter(w => w.length > 0),
  );
  const vocabularyDiversity
    = wordCount > 0
      ? Math.round((uniqueWords.size / wordCount) * 100) / 100
      : 0;

  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    avgSentenceLength,
    avgWordLength,
    readingLevel,
    readingGradeLevel,
    vocabularyDiversity,
    sentenceLengths,
  };
}

/**
 * Estimate syllable count in a word
 * Uses a simple heuristic approach
 */
function countSyllables(word: string): number {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');

  if (cleanWord.length <= 3) {
    return 1;
  }

  // Count vowel groups
  const vowelGroups = cleanWord.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;

  // Adjust for silent 'e' at end
  if (cleanWord.endsWith('e') && count > 1) {
    count--;
  }

  // Adjust for common suffixes
  const charBeforeLe = cleanWord[cleanWord.length - 3];
  if (cleanWord.endsWith('le') && cleanWord.length > 2 && charBeforeLe && !/[aeiouy]/.test(charBeforeLe)) {
    count++;
  }

  // Words like "created" have -ed as separate syllable
  if (cleanWord.endsWith('ed') && cleanWord.length > 3) {
    const beforeEd = cleanWord[cleanWord.length - 3];
    if (beforeEd === 't' || beforeEd === 'd') {
      count++;
    }
  }

  return Math.max(1, count);
}

/**
 * Convert Flesch-Kincaid grade level to a readable label
 */
function getReadingLevelLabel(gradeLevel: number): string {
  if (gradeLevel < 6) {
    return 'Elementary';
  }
  if (gradeLevel < 9) {
    return 'Middle School';
  }
  if (gradeLevel < 12) {
    return 'High School';
  }
  if (gradeLevel < 14) {
    return 'Undergraduate';
  }
  if (gradeLevel < 17) {
    return 'Graduate';
  }
  return 'Postgraduate';
}
