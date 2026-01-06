'use client';

import { Check } from 'lucide-react';

import { cn } from '@/utils/Helpers';

type Step = {
  id: string;
  label: string;
  description?: string;
};

type StepIndicatorProps = {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
};

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && index <= currentStep;

          return (
            <li key={step.id} className="flex-1">
              <div className="flex flex-col items-center">
                {/* Connector line (before) */}
                {index > 0 && (
                  <div className="absolute left-0 top-4 -translate-y-1/2 w-full">
                    <div
                      className={cn(
                        'h-0.5 w-full transition-colors duration-300',
                        isCompleted || isCurrent ? 'bg-primary' : 'bg-border',
                      )}
                    />
                  </div>
                )}

                {/* Step circle */}
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick?.(index)}
                  disabled={!isClickable}
                  className={cn(
                    'relative z-10 flex size-8 items-center justify-center rounded-full',
                    'text-sm font-medium transition-all duration-300',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isCompleted && [
                      'bg-primary text-primary-foreground',
                      isClickable && 'hover:bg-primary/90 cursor-pointer',
                    ],
                    isCurrent && [
                      'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    ],
                    !isCompleted && !isCurrent && [
                      'bg-muted text-muted-foreground',
                    ],
                    !isClickable && 'cursor-default',
                  )}
                >
                  {isCompleted
                    ? (
                        <Check className="size-4" />
                      )
                    : (
                        <span>{index + 1}</span>
                      )}
                </button>

                {/* Label */}
                <div className="mt-2 text-center">
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors duration-300',
                      isCurrent ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="mt-0.5 block text-xs text-muted-foreground/70">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Progress bar (alternative visual) */}
      <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep + 1) / steps.length) * 100}%`,
          }}
        />
      </div>
    </nav>
  );
}
