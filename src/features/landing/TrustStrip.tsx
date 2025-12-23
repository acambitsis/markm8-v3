import { Clock, GraduationCap, Shield, Sparkles } from 'lucide-react';

export const TrustStrip = () => {
  return (
    <div className="border-y border-border bg-slate-50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {/* University Grade */}
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-violet-500" />
            <span className="text-sm font-medium">University-grade feedback</span>
          </div>

          <div className="hidden h-4 w-px bg-border md:block" />

          {/* Privacy */}
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-green-500" />
            <span className="text-sm font-medium">100% Private & Secure</span>
          </div>

          <div className="hidden h-4 w-px bg-border md:block" />

          {/* Speed */}
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-violet-500" />
            <span className="text-sm font-medium">Results in ~3 minutes</span>
          </div>

          <div className="hidden h-4 w-px bg-border md:block" />

          {/* AI Models */}
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" />
            <span className="text-sm font-medium">3 AI models for accuracy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
