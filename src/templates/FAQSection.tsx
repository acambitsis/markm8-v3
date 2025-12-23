import { useTranslations } from 'next-intl';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Section } from '@/features/landing/Section';

export const FAQSection = () => {
  const t = useTranslations('FAQ');

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
      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.questionKey} value={`item-${index}`}>
              <AccordionTrigger>{t(faq.questionKey)}</AccordionTrigger>
              <AccordionContent>{t(faq.answerKey)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
};
