import { Clock, GraduationCap, Shield, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const TrustStrip = () => {
  const t = useTranslations('TrustStrip');

  return (
    <div className="border-y border-slate-200 bg-violet-50/50">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {/* University Grade */}
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-violet-500" />
            <span className="text-sm font-medium text-slate-700">{t('university_grade')}</span>
          </div>

          <div className="hidden h-4 w-px bg-slate-300 md:block" />

          {/* Privacy */}
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-green-500" />
            <span className="text-sm font-medium text-slate-700">{t('privacy')}</span>
          </div>

          <div className="hidden h-4 w-px bg-slate-300 md:block" />

          {/* Speed */}
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-violet-500" />
            <span className="text-sm font-medium text-slate-700">{t('speed')}</span>
          </div>

          <div className="hidden h-4 w-px bg-slate-300 md:block" />

          {/* AI Models */}
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">{t('ai_models')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
