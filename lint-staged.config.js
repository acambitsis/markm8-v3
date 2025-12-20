module.exports = {
  '**/*.{ts,tsx,js,jsx,mjs}': ['eslint --fix --no-warn-ignored'],
  '**/*.ts?(x)': () => 'npm run check-types',
};
