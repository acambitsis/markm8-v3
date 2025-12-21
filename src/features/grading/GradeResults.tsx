'use client';

import { CheckCircle2, ChevronDown, ExternalLink, Lightbulb, Target, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { GradeFeedback, ModelResult, PercentageRange } from '@/models/Schema';

type Props = {
  letterGradeRange: string;
  percentageRange: PercentageRange;
  feedback: GradeFeedback;
  modelResults: ModelResult[];
};

export function GradeResults({ letterGradeRange, percentageRange, feedback, modelResults }: Props) {
  const [showModelDetails, setShowModelDetails] = useState(false);

  return (
    <div className="space-y-6">
      {/* Grade Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-4xl font-bold">
            {letterGradeRange}
          </CardTitle>
          <CardDescription className="text-center text-lg">
            {percentageRange.lower}
            -
            {percentageRange.upper}
            %
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Model Results (Collapsed by default) */}
          <Collapsible open={showModelDetails} onOpenChange={setShowModelDetails}>
            <CollapsibleTrigger className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <span>View model scores</span>
              <ChevronDown className={`size-4 transition-transform ${showModelDetails ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-2">
                {modelResults.map((result, index) => (
                  <div
                    key={`${result.model}-${result.percentage}-${index}`}
                    className="flex items-center justify-between rounded-lg bg-muted p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{result.model}</span>
                      {!result.included && (
                        <Badge variant="secondary" className="text-xs">
                          Excluded
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {result.percentage}
                        %
                      </span>
                      {result.included
                        ? <CheckCircle2 className="size-4 text-green-600" />
                        : <XCircle className="size-4 text-muted-foreground" />}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Outlier detection excludes scores more than 10% different from the mean
              </p>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback.strengths.map(strength => (
            <div key={strength.title} className="space-y-1">
              <h4 className="font-medium">{strength.title}</h4>
              <p className="text-sm text-muted-foreground">{strength.description}</p>
              {strength.evidence && (
                <p className="text-sm italic text-muted-foreground">
                  "
                  {strength.evidence}
                  "
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Areas for Improvement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5 text-amber-500" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback.improvements.map(improvement => (
            <div key={improvement.title} className="space-y-2">
              <h4 className="font-medium">{improvement.title}</h4>
              <p className="text-sm text-muted-foreground">{improvement.description}</p>
              <p className="text-sm font-medium text-primary">{improvement.suggestion}</p>
              {improvement.detailedSuggestions && improvement.detailedSuggestions.length > 0 && (
                <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                  {improvement.detailedSuggestions.map(suggestion => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Language Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-5 text-blue-500" />
            Language Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedback.languageTips.map(tip => (
            <div key={tip.category} className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0">
                {tip.category}
              </Badge>
              <p className="text-sm">{tip.feedback}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resources */}
      {feedback.resources && feedback.resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="size-5 text-purple-500" />
              Recommended Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedback.resources.map(resource => (
              <div key={resource.title} className="space-y-1">
                {resource.url
                  ? (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {resource.title}
                        <ExternalLink className="ml-1 inline size-3" />
                      </a>
                    )
                  : (
                      <h4 className="font-medium">{resource.title}</h4>
                    )}
                <p className="text-sm text-muted-foreground">{resource.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
