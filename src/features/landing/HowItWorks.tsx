import { ArrowRight, CheckCircle2, FileText, Sparkles } from 'lucide-react';

import { Section } from './Section';

const steps = [
  {
    number: '1',
    icon: FileText,
    title: 'Submit Your Essay',
    description:
      'Paste your essay along with the assignment brief and rubric. Our system accepts any essay format.',
  },
  {
    number: '2',
    icon: Sparkles,
    title: 'AI Analysis',
    description:
      'Three independent AI models grade your essay in parallel, ensuring balanced and accurate feedback.',
  },
  {
    number: '3',
    icon: CheckCircle2,
    title: 'Get Your Results',
    description:
      'Receive a detailed grade range, strengths analysis, and specific improvement suggestions.',
  },
];

export const HowItWorks = () => {
  return (
    <Section
      subtitle="Simple Process"
      title="How It Works"
      description="Get your essay graded in three easy steps"
    >
      <div className="relative">
        {/* Connector line - desktop only */}
        <div className="absolute left-0 right-0 top-16 hidden h-0.5 bg-gradient-to-r from-transparent via-violet-200 to-transparent dark:via-violet-800 lg:block" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {/* Step number circle */}
              <div className="relative z-10 flex size-16 items-center justify-center rounded-full bg-violet-500 text-2xl font-bold text-white shadow-purple">
                {step.number}
              </div>

              {/* Arrow between steps - mobile */}
              {index < steps.length - 1 && (
                <div className="my-4 flex items-center justify-center md:hidden">
                  <ArrowRight className="size-6 rotate-90 text-violet-300" />
                </div>
              )}

              {/* Icon */}
              <div className="mt-6 flex size-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <step.icon className="size-6 text-violet-600 dark:text-violet-400" />
              </div>

              {/* Title */}
              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>

              {/* Description */}
              <p className="mt-2 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};
