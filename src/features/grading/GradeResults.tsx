'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, ExternalLink, Lightbulb, Target, XCircle } from 'lucide-react';
import { useState } from 'react';

import { StaggerItem } from '@/components/motion';
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
  letterGradeRange: string;
  percentageRange: PercentageRange;
  feedback: GradeFeedback;
  modelResults: ModelResult[];
};

export function GradeResults({ feedback, modelResults }: Props) {
  const [showModelDetails, setShowModelDetails] = useState(false);

  return (
    <>
      {/* Model Scores (Collapsed by default) */}
      <StaggerItem>
        <Collapsible open={showModelDetails} onOpenChange={setShowModelDetails}>
          <CollapsibleTrigger className="group flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <span>View AI model scores</span>
            <ChevronDown className={cn(
              'size-4 transition-transform duration-200',
              showModelDetails && 'rotate-180',
            )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-3">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {modelResults.map((result, index) => (
                    <motion.div
                      key={`${result.model}-${result.percentage}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'flex items-center justify-between rounded-lg p-3 transition-colors',
                        result.included ? 'bg-muted/50' : 'bg-muted/30',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-sm font-medium',
                          !result.included && 'text-muted-foreground',
                        )}
                        >
                          {result.model}
                        </span>
                        {!result.included && (
                          <Badge variant="secondary" className="text-xs">
                            Excluded
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'tabular-nums',
                          result.included ? 'font-medium' : 'text-muted-foreground',
                        )}
                        >
                          {result.percentage}
                          %
                        </span>
                        {result.included
                          ? <CheckCircle2 className="size-4 text-success" />
                          : <XCircle className="size-4 text-muted-foreground/50" />}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Outlier detection excludes scores more than 10% different from the mean
                </p>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </StaggerItem>

      {/* Strengths */}
      <StaggerItem>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex size-8 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="size-4 text-success" />
              </div>
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedback.strengths.map((strength, index) => (
              <div
                key={strength.title}
                className={cn(
                  'space-y-1.5',
                  index < feedback.strengths.length - 1 && 'border-b pb-4',
                )}
              >
                <h4 className="font-medium">{strength.title}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {strength.description}
                </p>
                {strength.evidence && (
                  <p className="rounded-lg bg-success/5 p-3 text-sm italic text-muted-foreground">
                    "
                    {strength.evidence}
                    "
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Areas for Improvement */}
      <StaggerItem>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Target className="size-4 text-amber-500" />
              </div>
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedback.improvements.map((improvement, index) => (
              <div
                key={improvement.title}
                className={cn(
                  'space-y-2',
                  index < feedback.improvements.length - 1 && 'border-b pb-4',
                )}
              >
                <h4 className="font-medium">{improvement.title}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {improvement.description}
                </p>
                <div className="rounded-lg bg-primary/5 p-3">
                  <p className="text-sm font-medium text-primary">
                    {improvement.suggestion}
                  </p>
                  {improvement.detailedSuggestions && improvement.detailedSuggestions.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {improvement.detailedSuggestions.map(suggestion => (
                        <li key={suggestion} className="flex items-start gap-2">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/50" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Language Tips */}
      <StaggerItem>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                <Lightbulb className="size-4 text-blue-500" />
              </div>
              Language Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedback.languageTips.map(tip => (
              <div key={tip.category} className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5 shrink-0">
                  {tip.category}
                </Badge>
                <p className="text-sm leading-relaxed">{tip.feedback}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Resources */}
      {feedback.resources && feedback.resources.length > 0 && (
        <StaggerItem>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <ExternalLink className="size-4 text-primary" />
                </div>
                Recommended Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {feedback.resources.map(resource => (
                <div
                  key={resource.title}
                  className="group rounded-lg border p-4 transition-colors hover:bg-muted/30"
                >
                  {resource.url
                    ? (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 font-medium text-primary group-hover:underline"
                        >
                          {resource.title}
                          <ExternalLink className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </a>
                      )
                    : (
                        <h4 className="font-medium">{resource.title}</h4>
                      )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </StaggerItem>
      )}
    </>
  );
}
