import { Star } from 'lucide-react';

import { Section } from './Section';

const testimonials = [
  {
    quote:
      'MarkM8 helped me understand exactly where my essay was weak. The feedback was specific and actionable.',
    author: 'Sarah M.',
    role: 'Psychology Student, UCLA',
    rating: 5,
  },
  {
    quote:
      'I used to stress about whether my essays were good enough. Now I get instant feedback before submitting.',
    author: 'James K.',
    role: 'Business Major, NYU',
    rating: 5,
  },
  {
    quote:
      'The three AI models approach gives me confidence the grade is accurate. Saved me so much time.',
    author: 'Emily R.',
    role: 'English Lit Student, Oxford',
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <Section
      subtitle="Student Reviews"
      title="Trusted by Thousands of Students"
      description="See what students are saying about MarkM8"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map(testimonial => (
          <div
            key={testimonial.author}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Stars */}
            <div className="flex gap-0.5">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star
                  key={i}
                  className="size-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>

            {/* Quote */}
            <p className="mt-4 text-muted-foreground">
              "
              {testimonial.quote}
              "
            </p>

            {/* Author */}
            <div className="mt-4 border-t border-border pt-4">
              <p className="font-semibold">{testimonial.author}</p>
              <p className="text-sm text-muted-foreground">{testimonial.role}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};
