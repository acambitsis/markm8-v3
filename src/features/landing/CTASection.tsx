import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { cn } from '@/utils/Helpers';

export const CTASection = () => {
  return (
    <div className="px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-violet-600 to-violet-400 px-8 py-16 text-center text-white shadow-purple-lg md:px-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Improve Your Essays?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-violet-100">
            Join thousands of students getting better grades with instant AI feedback.
            Start with a free credit.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-white text-violet-700 hover:bg-violet-50',
              )}
            >
              Get Started Free
              <ArrowRight className="ml-2 size-4" />
            </Link>

            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'lg' }),
                'text-white hover:bg-white/10 hover:text-white',
              )}
            >
              Sign In
            </Link>
          </div>

          <p className="mt-6 text-sm text-violet-200">
            No credit card required. 1 free credit on signup.
          </p>
        </div>
      </div>
    </div>
  );
};
