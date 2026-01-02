module.exports = {
  // If Convex code changes (excluding generated files), regenerate + stage generated types
  'convex/**/*.{ts,tsx}': (files) => {
    const nonGenerated = files.filter(
      f => !f.startsWith('convex/_generated/'),
    );

    if (nonGenerated.length === 0) {
      return [];
    }

    return [
      'bun run convex:dev --once',
      'git add convex/_generated',
    ];
  },

  '**/*.{ts,tsx,js,jsx,mjs}': ['eslint --fix --no-warn-ignored'],

  // Use bun consistently (avoids "npm vs bun" drift)
  '**/*.ts?(x)': () => 'bun run check-types',
};
