import {
  BarChart3,
  Brain,
  Clock,
  CreditCard,
  FileText,
  Lock,
} from 'lucide-react';

import { FeatureCard } from './FeatureCard';
import { Section } from './Section';

const features = [
  {
    icon: Brain,
    title: 'Triple AI Consensus',
    description:
      'Three independent AI models grade your essay in parallel. Outliers are detected and excluded for accuracy.',
  },
  {
    icon: BarChart3,
    title: 'Detailed Feedback',
    description:
      'Get a grade range, not just a single number. See exactly where your essay excels and where it needs work.',
  },
  {
    icon: FileText,
    title: 'Rubric-Aligned',
    description:
      'Upload your assignment rubric and our AI grades against it, just like your professor would.',
  },
  {
    icon: Clock,
    title: 'Fast Results',
    description:
      'No more waiting. Get comprehensive feedback in under 5 minutes, any time of day.',
  },
  {
    icon: CreditCard,
    title: 'Pay Per Essay',
    description:
      'No subscriptions. Just buy credits when you need them. One credit = one essay graded.',
  },
  {
    icon: Lock,
    title: 'Private & Secure',
    description:
      'Your essays are never stored, shared, or used for training. Grade with confidence.',
  },
];

export const FeaturesGrid = () => {
  return (
    <Section
      subtitle="Why MarkM8"
      title="Everything You Need for Better Grades"
      description="Instant, accurate feedback that helps you improve before you submit"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map(feature => (
          <FeatureCard
            key={feature.title}
            icon={
              <feature.icon className="size-6 text-violet-600 dark:text-violet-400" />
            }
            title={feature.title}
          >
            {feature.description}
          </FeatureCard>
        ))}
      </div>
    </Section>
  );
};
