'use client';

import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Sparkles,
  Target,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { Id } from '../../../convex/_generated/dataModel';
import type { GradeFeedback, ModelResult, PercentageRange } from '../../../convex/schema';
import { ActualGradeSection } from './ActualGradeSection';
import { ScoreRangeBar } from './components/ScoreRangeBar';

type Props = {
  percentageRange: PercentageRange;
  feedback: GradeFeedback;
  modelResults: ModelResult[];
  // Synthesis info for timing display
  synthesized?: boolean;
  synthesisDurationMs?: number;
  // Optional essay data for actual grade feature
  essayId?: Id<'essays'>;
  actualGrade?: string;
  actualFeedback?: string;
  onSaveActualGrade?: (data: { essayId: Id<'essays'>; actualGrade?: string; actualFeedback?: string }) => Promise<void>;
};

// Stagger animation variants
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

export function GradeResults({
  percentageRange,
  feedback,
  modelResults,
  synthesized,
  synthesisDurationMs,
  essayId,
  actualGrade,
  actualFeedback,
  onSaveActualGrade,
}: Props) {
  // Build stats for the hero section
  const stats = [
    { value: feedback.strengths.length, label: 'Strengths', color: 'text-green-600' },
    { value: feedback.improvements.length, label: 'To Improve', color: 'text-amber-600' },
    { value: feedback.languageTips.length, label: 'Tips', color: 'text-blue-600' },
  ];

  return (
    <motion.div
      data-testid="grade-results"
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Grade Summary Card - Hero Section */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 px-6 py-5">
            <ScoreRangeBar
              percentageRange={percentageRange}
              modelResults={modelResults}
              stats={stats}
              delay={0.3}
              synthesized={synthesized}
              synthesisDurationMs={synthesisDurationMs}
            />
          </div>
        </Card>
      </motion.div>

      {/* Strengths */}
      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
                <Award className="size-5 text-green-600" />
              </div>
              <div>
                <span>Strengths</span>
                <p className="mt-0.5 text-sm font-normal text-muted-foreground">
                  What you did well
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {feedback.strengths.map((strength, index) => (
              <motion.div
                key={strength.title}
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-500" />
                  <div>
                    <h4 className="font-medium">{strength.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{strength.description}</p>
                    {strength.evidence && (
                      <blockquote className="mt-2 border-l-2 border-green-500/30 pl-3 text-sm italic text-muted-foreground">
                        &ldquo;
                        {strength.evidence}
                        &rdquo;
                      </blockquote>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Areas for Improvement */}
      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Target className="size-5 text-amber-600" />
              </div>
              <div>
                <span>Areas for Improvement</span>
                <p className="mt-0.5 text-sm font-normal text-muted-foreground">
                  How you can enhance your essay
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {feedback.improvements.map((improvement, index) => (
              <motion.div
                key={improvement.title}
                className="space-y-3 rounded-lg bg-muted/50 p-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <h4 className="font-medium">{improvement.title}</h4>
                <p className="text-sm text-muted-foreground">{improvement.description}</p>

                {/* Main suggestion highlighted */}
                <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-sm font-medium text-primary">{improvement.suggestion}</p>
                </div>

                {/* Detailed suggestions */}
                {improvement.detailedSuggestions && improvement.detailedSuggestions.length > 0 && (
                  <ul className="ml-4 space-y-1 text-sm text-muted-foreground">
                    {improvement.detailedSuggestions.map(suggestion => (
                      <li key={suggestion} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Language Tips */}
      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Lightbulb className="size-5 text-blue-600" />
              </div>
              <div>
                <span>Language Tips</span>
                <p className="mt-0.5 text-sm font-normal text-muted-foreground">
                  Grammar, style, and mechanics
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {feedback.languageTips.map((tip, index) => (
                <motion.div
                  key={tip.category}
                  className="flex items-start gap-3 rounded-lg border p-4"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge variant="secondary" className="shrink-0">
                    {tip.category}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{tip.feedback}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resources */}
      {feedback.resources && feedback.resources.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <BookOpen className="size-5 text-purple-600" />
                </div>
                <div>
                  <span>Recommended Resources</span>
                  <p className="mt-0.5 text-sm font-normal text-muted-foreground">
                    Learn more and improve
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {feedback.resources.map((resource, index) => (
                  <motion.div
                    key={resource.title}
                    className="rounded-lg border p-4 transition-colors hover:border-primary/30 hover:bg-muted/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {resource.url
                      ? (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group"
                          >
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-primary group-hover:underline">
                                {resource.title}
                              </h4>
                              <ExternalLink className="size-3.5 text-muted-foreground" />
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>
                          </a>
                        )
                      : (
                          <>
                            <h4 className="font-medium">{resource.title}</h4>
                            <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>
                          </>
                        )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actual Grade Section (for user calibration) */}
      {essayId && onSaveActualGrade && (
        <ActualGradeSection
          essayId={essayId}
          actualGrade={actualGrade}
          actualFeedback={actualFeedback}
          onSave={onSaveActualGrade}
        />
      )}
    </motion.div>
  );
}
