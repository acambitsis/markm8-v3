import { expect, test } from '@playwright/test';

test.describe('Sanity', () => {
  test.describe('Static pages', () => {
    test('should display the homepage', async ({ page, baseURL }) => {
      await page.goto(`${baseURL}/`);

      await expect(page.getByRole('heading', { name: /Ready to Improve Your Grade/i })).toBeVisible();
    });
  });
});
