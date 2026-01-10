'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, FileText, Lightbulb, Quote, Sparkles, Users, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getQuotes } from '@/data/waitingTips';
import type { EssayStats } from '@/utils/essayStats';

import type { TopicInsights } from '../../../../convex/schema';

type InsightItem = {
  icon: React.ReactNode;
  label: string;
  text: string;
};

type InsightCarouselProps = {
  essayStats?: EssayStats | null;
  topicInsights?: TopicInsights;
  hasTopicInsights: boolean;
  intervalMs?: number;
};

/**
 * Unified carousel combining essay stats, tips, and LLM insights
 * Single source of rotating information during grading wait
 */
export function InsightCarousel({
  essayStats,
  topicInsights,
  hasTopicInsights,
  intervalMs = 6000,
}: InsightCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Build unified list of items
  const items: InsightItem[] = useMemo(() => {
    const allItems: InsightItem[] = [];

    // Essay stats (single item)
    if (essayStats) {
      allItems.push({
        icon: <FileText className="size-4" />,
        label: 'Your essay',
        text: `${essayStats.wordCount.toLocaleString()} words · ${essayStats.sentenceCount} sentences`,
      });
    }

    // If we have LLM-generated insights, add those
    if (hasTopicInsights && topicInsights) {
      const insightGroups: Array<{
        items: string[] | undefined;
        icon: React.ReactNode;
        label: string;
      }> = [
        { items: topicInsights.hooks, icon: <Sparkles className="size-4" />, label: 'About this topic' },
        { items: topicInsights.thinkers, icon: <Users className="size-4" />, label: 'Key thinker' },
        { items: topicInsights.concepts, icon: <Zap className="size-4" />, label: 'Key concept' },
        { items: topicInsights.reads, icon: <BookOpen className="size-4" />, label: 'Worth reading' },
      ];

      for (const { items: groupItems, icon, label } of insightGroups) {
        if (groupItems) {
          allItems.push(...groupItems.map(text => ({ icon, label, text })));
        }
      }

      if (topicInsights.funFact) {
        allItems.push({
          icon: <Lightbulb className="size-4" />,
          label: 'Did you know?',
          text: topicInsights.funFact,
        });
      }
    } else {
      // Tier 1: Famous quotes while waiting for LLM
      allItems.push(
        ...getQuotes().map(quote => ({
          icon: <Quote className="size-4" />,
          label: quote.author,
          text: `"${quote.text}"`,
        })),
      );
    }

    return allItems;
  }, [essayStats, hasTopicInsights, topicInsights]);

  // Reset index when content changes significantly
  useEffect(() => {
    setCurrentIndex(0);
  }, [hasTopicInsights]);

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
      {/* Label with icon */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`label-${currentIndex}`}
          className="mb-2 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <span className="text-primary">{currentItem.icon}</span>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {currentItem.label}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Main text */}
      <div className="relative min-h-[48px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            className="text-lg font-medium leading-snug text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            {currentItem.text}
          </motion.p>
        </AnimatePresence>
      </div>

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
        {hasTopicInsights && (
          <span className="text-[10px] text-muted-foreground/40">AI</span>
        )}
      </div>
    </motion.div>
  );
}
