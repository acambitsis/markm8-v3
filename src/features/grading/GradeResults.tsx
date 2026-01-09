'use client';

import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Lightbulb,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

import { ScoreGauge } from '@/components/ScoreGauge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/utils/Helpers';

import type { GradeFeedback, ModelResult, PercentageRange } from '../../../convex/schema';

type Props = {
  percentageRange: PercentageRange;
  feedback: GradeFeedback;
  modelResults: ModelResult[];
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

// Get grade color based on percentage
const getPercentageColor = (percentage: number) => {
  if (percentage >= 90) {
    return 'text-green-600';
  }
  if (percentage >= 80) {
    return 'text-blue-600';
  }
  if (percentage >= 70) {
    return 'text-yellow-600';
  }
  if (percentage >= 60) {
    return 'text-orange-600';
  }
  return 'text-red-600';
};

export function GradeResults({ percentageRange, feedback, modelResults }: Props) {
  const [showModelDetails, setShowModelDetails] = useState(false);
  const midScore = (percentageRange.lower + percentageRange.upper) / 2;

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Grade Summary Card - Hero Section */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8">
            <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
              {/* Score Gauge */}
              <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
                <ScoreGauge
                  score={midScore}
                  size="lg"
                  label="Overall Score"
                  delay={0.5}
                />

                {/* Percentage range display */}
                <div className="text-center md:text-left">
                  <motion.div
                    className={cn('text-5xl font-bold', getPercentageColor(midScore))}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    {percentageRange.lower === percentageRange.upper
                      ? `${percentageRange.lower}%`
                      : `${percentageRange.lower}-${percentageRange.upper}%`}
                  </motion.div>
                  <motion.p
                    className="mt-1 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                  >
                    Overall Score
                  </motion.p>
                </div>
              </div>

              {/* Quick stats */}
              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6 }}
              >
                <div className="rounded-xl bg-card/80 p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-green-600">{feedback.strengths.length}</div>
                  <div className="text-xs text-muted-foreground">Strengths</div>
                </div>
                <div className="rounded-xl bg-card/80 p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-amber-600">{feedback.improvements.length}</div>
                  <div className="text-xs text-muted-foreground">To Improve</div>
                </div>
                <div className="rounded-xl bg-card/80 p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{feedback.languageTips.length}</div>
                  <div className="text-xs text-muted-foreground">Tips</div>
                </div>
              </motion.div>
            </div>

            {/* Model Results Collapsible */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              <Collapsible open={showModelDetails} onOpenChange={setShowModelDetails}>
                <CollapsibleTrigger className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <span>
                    {modelResults.length}
                    {' '}
                    AI models analyzed your essay
                  </span>
                  <ChevronDown className={cn('size-4 transition-transform', showModelDetails && 'rotate-180')} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {modelResults.map(result => (
                      <div
                        key={`${result.model}-${result.percentage}`}
                        className={cn(
                          'flex items-center justify-between rounded-lg bg-card/60 p-3',
                          !result.included && 'opacity-60',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {result.included
                            ? <CheckCircle2 className="size-4 text-green-500" />
                            : <XCircle className="size-4 text-muted-foreground" />}
                          <span className="text-sm font-medium">{result.model}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {result.percentage}
                            %
                          </span>
                          {!result.included && (
                            <Badge variant="outline" className="text-xs">
                              Outlier
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Outlier detection excludes scores &gt;10% different from the mean for more accurate results
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
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
    </motion.div>
  );
}
