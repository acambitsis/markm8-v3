import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { Section } from './Section';

const faqs = [
  {
    question: 'How does the AI grading work?',
    answer:
      'MarkM8 uses three independent AI models to grade your essay in parallel. Each model analyzes your work against your assignment brief and rubric. We then use consensus analysis to provide a grade range, excluding any outlier grades that differ significantly from the mean. This triple-check approach ensures more accurate and reliable feedback.',
  },
  {
    question: 'Is my essay stored or used for AI training?',
    answer:
      'Absolutely not. Your essays are processed in real-time and never stored on our servers. We do not use your work to train AI models. Your academic integrity and privacy are our top priorities.',
  },
  {
    question: 'How accurate is the grading compared to a professor?',
    answer:
      'Our AI models are trained on professional academic grading standards. While no AI can perfectly replicate human judgment, MarkM8 provides feedback that aligns closely with university grading criteria. Most students find the grade range we provide is within one grade level of their final mark.',
  },
  {
    question: 'What do I need to submit my essay?',
    answer:
      'You\'ll need three things: (1) Your essay content, (2) The assignment brief explaining what was asked, and (3) Optionally, the grading rubric your professor provided. The more context you give, the more accurate the feedback.',
  },
  {
    question: 'How long does grading take?',
    answer:
      'Most essays are graded in 2-3 minutes. Very long essays (over 5,000 words) may take up to 5 minutes. You\'ll see a real-time progress indicator while we process your work.',
  },
  {
    question: 'What happens if I\'m not satisfied with the results?',
    answer:
      'If our grading fails due to a technical issue, your credit is automatically refunded. For feedback quality concerns, reach out to our support team. We stand behind our service.',
  },
  {
    question: 'Can I use MarkM8 for any type of essay?',
    answer:
      'Yes! MarkM8 works with argumentative essays, research papers, literary analysis, case studies, and more. As long as you provide clear assignment criteria, our AI can grade it.',
  },
  {
    question: 'Do credits expire?',
    answer:
      'No, credits never expire. Buy them when you need them and use them whenever you want.',
  },
];

export const FAQSection = () => {
  return (
    <Section
      subtitle="Got Questions?"
      title="Frequently Asked Questions"
      description="Everything you need to know about MarkM8"
    >
      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
};
