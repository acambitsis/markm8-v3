// Famous quotes for the grading waiting experience
// Themes: writing, learning, success, feedback, humility, growth

export const quotes = [
  { text: 'The first draft is just you telling yourself the story.', author: 'Terry Pratchett' },
  { text: 'Write drunk, edit sober.', author: 'Ernest Hemingway' },
  { text: 'The beautiful part of writing is that you don\'t have to get it right the first time.', author: 'Robert Cormier' },
  { text: 'I have not failed. I\'ve just found 10,000 ways that won\'t work.', author: 'Thomas Edison' },
  { text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates' },
  { text: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', author: 'Mahatma Gandhi' },
  { text: 'Education is not the filling of a pail, but the lighting of a fire.', author: 'W.B. Yeats' },
  { text: 'The more I read, the more I acquire, the more certain I am that I know nothing.', author: 'Voltaire' },
  { text: 'Feedback is the breakfast of champions.', author: 'Ken Blanchard' },
  { text: 'We all need people who will give us feedback. That\'s how we improve.', author: 'Bill Gates' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.', author: 'Nelson Mandela' },
  { text: 'It is not that I\'m so smart. But I stay with the questions much longer.', author: 'Albert Einstein' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'A mind stretched by new experience can never go back to its old dimensions.', author: 'Oliver Wendell Holmes' },
  { text: 'The pen is mightier than the sword.', author: 'Edward Bulwer-Lytton' },
  { text: 'Either write something worth reading or do something worth writing.', author: 'Benjamin Franklin' },
  { text: 'Start writing, no matter what. The water does not flow until the faucet is turned on.', author: 'Louis L\'Amour' },
  { text: 'You can always edit a bad page. You can\'t edit a blank page.', author: 'Jodi Picoult' },
];

/**
 * Get quotes for display during grading wait
 * Returns all quotes (they'll be rotated by the carousel)
 */
export function getQuotes(): Array<{ text: string; author: string }> {
  // Shuffle the quotes so they appear in random order each time
  return [...quotes].sort(() => Math.random() - 0.5);
}

// Legacy export for compatibility (now returns quotes formatted as tips)
export function getTipsForSubject(_subject: string): string[] {
  return getQuotes().map(q => `"${q.text}" — ${q.author}`);
}
