'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, FileText, GraduationCap, Scale } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { academicLevelLabels, type SampleGrade, sampleGrades } from '@/data/sampleGrades';
import { GradeResults } from '@/features/grading/GradeResults';
import { cn } from '@/utils/Helpers';

// Icons for each subject
const subjectIcons: Record<string, React.ElementType> = {
  Philosophy: BookOpen,
  Law: Scale,
  Literature: FileText,
};

// Sample metadata header component
function SampleHeader({ sample }: { sample: SampleGrade }) {
  const t = useTranslations('SampleFeedback');
  const Icon = subjectIcons[sample.subject] || GraduationCap;

  return (
    <motion.div
      className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 sm:text-lg">{sample.title}</h3>
            <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-600">
              <span>{sample.subject}</span>
              <span className="text-slate-300">|</span>
              <span>{academicLevelLabels[sample.academicLevel]}</span>
              <span className="text-slate-300">|</span>
              <span>
                {sample.wordCount.toLocaleString()}
                {' '}
                {t('words')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function SampleFeedbackShowcase() {
  const t = useTranslations('SampleFeedback');
  const [activeTab, setActiveTab] = useState(sampleGrades[0]?.id ?? '');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab Navigation */}
        <div className="mb-6 flex justify-center">
          <TabsList className="inline-flex h-auto flex-wrap gap-1 bg-slate-100/80 p-1.5 sm:flex-nowrap">
            {sampleGrades.map((sample) => {
              const Icon = subjectIcons[sample.subject] || GraduationCap;
              return (
                <TabsTrigger
                  key={sample.id}
                  value={sample.id}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
                    'data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm',
                    'data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900',
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{sample.subject}</span>
                  <span className="sm:hidden">{sample.subject.slice(0, 4)}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab Content */}
        {sampleGrades.map(sample => (
          <TabsContent
            key={sample.id}
            value={sample.id}
            className="mt-0 focus-visible:outline-none focus-visible:ring-0"
          >
            <SampleHeader sample={sample} />

            {/* Grade Results - Reuse existing component */}
            <div className="[&_.space-y-6]:space-y-4">
              <GradeResults
                letterGradeRange={sample.letterGradeRange}
                percentageRange={sample.percentageRange}
                feedback={sample.feedback}
                modelResults={sample.modelResults}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* CTA Button */}
      <motion.div
        className="mt-10 flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Button
          asChild
          size="lg"
          className="group gap-2 bg-violet-600 px-8 py-6 text-base font-semibold hover:bg-violet-700"
        >
          <Link href="/sign-up">
            {t('cta_button')}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
