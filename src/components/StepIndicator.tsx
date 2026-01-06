'use client';

import { motion } from 'framer-motion';
import { Check, ClipboardList, FileText, Target } from 'lucide-react';

import { cn } from '@/utils/Helpers';

type Step = {
  id: string;
  label: string;
  icon: 'brief' | 'focus' | 'content';
};

type StepIndicatorProps = {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
};

const iconMap = {
  brief: ClipboardList,
  focus: Target,
  content: FileText,
};

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => {
        const Icon = iconMap[step.icon];
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = step.id === currentStep;
        const isPast = index < currentIndex;
        const isClickable = onStepClick && (isCompleted || isPast || index === currentIndex);

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <button
              type="button"
              onClick={() => isClickable && onStepClick?.(step.id)}
              disabled={!isClickable}
              className={cn(
                'group relative flex flex-col items-center gap-2',
                isClickable && 'cursor-pointer',
                !isClickable && 'cursor-default',
              )}
            >
              {/* Circle */}
              <motion.div
                className={cn(
                  'relative flex size-12 items-center justify-center rounded-full border-2 transition-all duration-300',
                  isCompleted && 'border-primary bg-primary text-white',
                  isCurrent && !isCompleted && 'border-primary bg-primary/10 text-primary',
                  !isCurrent && !isCompleted && 'border-muted-foreground/30 bg-muted text-muted-foreground',
                  isClickable && !isCurrent && 'group-hover:border-primary/50 group-hover:bg-primary/5',
                )}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {isCompleted
                  ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                      >
                        <Check className="size-5" strokeWidth={3} />
                      </motion.div>
                    )
                  : (
                      <Icon className="size-5" />
                    )}

                {/* Current step ring */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: 1.3, opacity: [0, 0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium transition-colors',
                  isCurrent && 'text-primary',
                  isCompleted && 'text-foreground',
                  !isCurrent && !isCompleted && 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="relative mx-2 h-0.5 w-12 bg-muted-foreground/20 sm:mx-4 sm:w-20">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary"
                  initial={{ width: '0%' }}
                  animate={{
                    width: isPast || isCompleted ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
