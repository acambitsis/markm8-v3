import { useTranslations } from 'next-intl';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Section } from '@/features/landing/Section';

export const FAQ = () => {
  const t = useTranslations('FAQ');

  return (
    <Section
      id="faq"
      subtitle={t('section_subtitle')}
      title={t('section_title')}
    >
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-left">{t('question1')}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{t('answer1')}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger className="text-left">{t('question2')}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{t('answer2')}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-left">{t('question3')}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{t('answer3')}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-left">{t('question4')}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{t('answer4')}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-5">
          <AccordionTrigger className="text-left">{t('question5')}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{t('answer5')}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-6">
          <AccordionTrigger className="text-left">{t('question6')}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{t('answer6')}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Section>
  );
};
