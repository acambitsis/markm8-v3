'use client';

import { ArrowRight, Lock, Star } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { cn } from '@/utils/Helpers';

export const ToolHero = () => {
  return (
    <div className="px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-4xl">
        {/* Trust Badge */}
        <div className="mb-6 flex items-center justify-center gap-1.5">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="size-4 fill-amber-400 text-amber-400"
              />
            ))}
          </div>
          <span className="text-sm font-medium">4.9/5</span>
          <span className="text-sm text-muted-foreground">
            from 2,000+ students
          </span>
        </div>

        {/* Title */}
        <h1 className="text-balance text-center text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Get Your Essay
          {' '}
          <span className="text-gradient">Graded by AI</span>
          <br />
          in Under 5 Minutes
        </h1>

        {/* Description */}
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-center text-lg text-muted-foreground md:text-xl">
          Instant feedback aligned with university grading standards.
          Three AI models. One comprehensive grade. Just $2 per essay.
        </p>

        {/* Tool Preview Card */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-1 shadow-lg">
          <div className="rounded-xl border border-border bg-background p-6">
            {/* Textarea Preview */}
            <div className="relative">
              <textarea
                className="min-h-[200px] w-full resize-none rounded-lg border border-input bg-background p-4 text-base leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="Paste your essay here to get started...

You'll also need to provide:
• Your assignment brief
• The grading rubric (optional)

Our AI will analyze your essay against professional grading standards and provide detailed feedback."
                readOnly
              />
            </div>

            {/* CTA Button */}
            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="size-4" />
                <span>Your essay is never stored or shared</span>
              </div>

              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-violet-500 hover:bg-violet-600 hover:shadow-purple',
                )}
              >
                Grade My Essay
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Secondary CTA */}
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: 'ghost' })}
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
