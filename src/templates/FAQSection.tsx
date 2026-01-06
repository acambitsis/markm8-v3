'use client';

import { AnimatePresence, motion, useInView } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { Section } from '@/features/landing/Section';

type FAQItemProps = {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  isInView: boolean;
};

const FAQItem = ({ question, answer, isOpen, onToggle, index, isInView }: FAQItemProps) => {
  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <motion.div
        className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
          isOpen
            ? 'border-violet-200 bg-violet-50/50 shadow-lg shadow-violet-500/5'
            : 'border-slate-200 bg-white hover:border-violet-200 hover:shadow-md'
        }`}
        layout
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 p-5 text-left md:p-6"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-4">
            <motion.div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                isOpen ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600'
              }`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <HelpCircle className="size-5" />
            </motion.div>
            <span className={`text-base font-semibold transition-colors md:text-lg ${
              isOpen ? 'text-violet-900' : 'text-slate-900'
            }`}
            >
              {question}
            </span>
          </div>
          <motion.div
            className={`shrink-0 rounded-full p-1 transition-colors ${
              isOpen ? 'bg-violet-200 text-violet-700' : 'bg-slate-100 text-slate-500'
            }`}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <ChevronDown className="size-5" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="px-5 pb-5 md:px-6 md:pb-6">
                <div className="ml-14 border-l-2 border-violet-200 pl-4">
                  <p className="text-slate-600 leading-relaxed">{answer}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export const FAQSection = () => {
  const t = useTranslations('FAQ');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { questionKey: 'question1' as const, answerKey: 'answer1' as const },
    { questionKey: 'question2' as const, answerKey: 'answer2' as const },
    { questionKey: 'question3' as const, answerKey: 'answer3' as const },
    { questionKey: 'question4' as const, answerKey: 'answer4' as const },
    { questionKey: 'question5' as const, answerKey: 'answer5' as const },
    { questionKey: 'question6' as const, answerKey: 'answer6' as const },
  ];

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <div ref={ref} className="mx-auto max-w-3xl space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem
            key={faq.questionKey}
            question={t(faq.questionKey)}
            answer={t(faq.answerKey)}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            index={index}
            isInView={isInView}
          />
        ))}
      </div>

      {/* Contact prompt */}
      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <p className="text-slate-600">
          Still have questions?
          {' '}
          <motion.a
            href="mailto:support@markm8.com"
            className="font-semibold text-violet-600 hover:text-violet-700"
            whileHover={{ scale: 1.02 }}
          >
            Contact our support team
          </motion.a>
        </p>
      </motion.div>
    </Section>
  );
};
