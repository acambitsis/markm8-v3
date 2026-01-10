// Essay Statistics Calculator
// Client-side calculations for the waiting experience (Tier 1)
// No LLM needed - pure text analysis

export type EssayStats = {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgSentenceLength: number;
  avgWordLength: number;
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
    vocabularyDiversity,
    sentenceLengths,
  };
}
