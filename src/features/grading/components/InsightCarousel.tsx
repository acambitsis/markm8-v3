'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { FileText, ScanSearch } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { EssayStats } from '@/utils/essayStats';

import type { EssayObservations } from '../../../../convex/schema';

// Stage labels for pre-LLM scanning effect
const SCANNING_STAGES = [
  'Scanning your introduction',
  'Reading your arguments',
  'Examining your evidence',
  'Analyzing your structure',
  'Understanding your conclusion',
  'Processing your ideas',
];

type ObservationItem = {
  stage: string;
  quote: string;
  note?: string; // Only present for LLM observations
  isLLM: boolean;
};

type InsightCarouselProps = {
  essayStats?: EssayStats | null;
  essayContent?: string;
  observations?: EssayObservations;
  hasObservations: boolean;
  intervalMs?: number;
};

/**
 * Extract interesting sentences from essay for pre-LLM display
 * Shows the user their own content being "scanned"
 */
function extractSentences(content: string, count: number = 5): string[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  // Split into sentences
  const sentences = content
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter((s) => {
      // Filter for meaningful sentences (4-25 words)
      const wordCount = s.split(/\s+/).length;
      return wordCount >= 4 && wordCount <= 25;
    });

  if (sentences.length === 0) {
    return [];
  }

  // Pick sentences from different parts of the essay
  const selected: string[] = [];
  const step = Math.max(1, Math.floor(sentences.length / count));

  for (let i = 0; i < sentences.length && selected.length < count; i += step) {
    const sentence = sentences[i];
    if (sentence) {
      // Truncate if too long (keep first ~15 words)
      const words = sentence.split(/\s+/);
      const truncated = words.length > 15
        ? `${words.slice(0, 15).join(' ')}...`
        : sentence;
      selected.push(truncated);
    }
  }

  return selected;
}

/**
 * Carousel showing essay understanding during grading wait
 * Pre-LLM: Shows essay sentences being "scanned"
 * Post-LLM: Shows observations with stage/quote/note
 */
export function InsightCarousel({
  essayStats,
  essayContent,
  observations,
  hasObservations,
  intervalMs = 5000,
}: InsightCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Build unified list of items
  const items: ObservationItem[] = useMemo(() => {
    const allItems: ObservationItem[] = [];

    if (hasObservations && observations?.observations) {
      // Post-LLM: Show the actual observations
      for (const obs of observations.observations) {
        allItems.push({
          stage: obs.stage,
          quote: obs.quote,
          note: obs.note,
          isLLM: true,
        });
      }
    } else {
      // Pre-LLM: Show essay sentences being "scanned"
      const sentences = extractSentences(essayContent ?? '', 5);

      if (sentences.length > 0) {
        sentences.forEach((sentence, index) => {
          allItems.push({
            stage: SCANNING_STAGES[index % SCANNING_STAGES.length] ?? 'Analyzing',
            quote: sentence,
            isLLM: false,
          });
        });
      } else {
        // Fallback if no sentences extracted
        allItems.push({
          stage: 'Analyzing your essay',
          quote: essayStats
            ? `${essayStats.wordCount.toLocaleString()} words · ${essayStats.sentenceCount} sentences`
            : 'Processing...',
          isLLM: false,
        });
      }
    }

    return allItems;
  }, [essayContent, essayStats, hasObservations, observations]);

  // Reset index when content changes significantly
  useEffect(() => {
    setCurrentIndex(0);
  }, [hasObservations]);

  // Auto-rotate
  const nextItem = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (isPaused || items.length <= 1) {
      return;
    }

    const timer = setInterval(nextItem, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, isPaused, nextItem, items.length]);

  const currentItem = items[currentIndex];
  if (!currentItem) {
    return null;
  }

  return (
    <motion.div
      className="rounded-xl border bg-gradient-to-br from-card to-muted/20 p-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Stage label with icon */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`stage-${currentIndex}`}
          className="mb-3 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <span className="text-primary">
            {currentItem.isLLM
              ? (
                  <FileText className="size-4" />
                )
              : (
                  <ScanSearch className="size-4" />
                )}
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {currentItem.stage}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Quote from essay */}
      <div className="relative min-h-[52px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={`quote-${currentIndex}`}
            className="text-base italic leading-relaxed text-foreground/90"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            &ldquo;
            {currentItem.quote}
            &rdquo;
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Note (only for LLM observations) */}
      {currentItem.isLLM && currentItem.note && (
        <AnimatePresence mode="wait">
          <motion.p
            key={`note-${currentIndex}`}
            className="mt-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {currentItem.note}
          </motion.p>
        </AnimatePresence>
      )}

      {/* Progress dots */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1">
          {items.map((_, index) => (
            <motion.button
              type="button"
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'w-5 bg-primary/50'
                  : 'w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/30'
              }`}
              aria-label={`Go to item ${index + 1}`}
            />
          ))}
        </div>
        {hasObservations && (
          <span className="text-[10px] text-muted-foreground/40">AI</span>
        )}
      </div>
    </motion.div>
  );
}
